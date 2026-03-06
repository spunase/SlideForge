/**
 * Render stage — parses each slide segment HTML into a DOM document.
 *
 * Browser mode: renders each segment in an offscreen iframe so computed styles
 * and layout geometry can be measured accurately.
 * Test/Node mode: falls back to DOMParser parsing.
 */

import type { ConversionOptions } from '../../types';

export interface RenderResult {
  documents: Document[];
  cleanup?: () => void;
}

/**
 * Parse each HTML slide segment into a DOM Document for extraction.
 *
 * @param segments - Array of HTML strings, one per slide
 * @param options - Slide dimensions and conversion options
 * @returns Parsed DOM documents for each slide
 */
export async function render(
  segments: string[],
  options: ConversionOptions,
  assets: Map<string, Blob>,
): Promise<RenderResult> {
  if (!isBrowserRuntime() || isJsDomRuntime()) {
    return parseSegmentsWithDomParser(segments, assets);
  }

  return renderSegmentsInIframes(segments, options, assets);
}

function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function isJsDomRuntime(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.toLowerCase().includes('jsdom')
  );
}

function ensureFullHtml(segment: string): string {
  if (segment.includes('<html')) {
    return segment;
  }

  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8" />',
    '<style>html, body { margin: 0; padding: 0; }</style>',
    '</head>',
    `<body>${segment}</body>`,
    '</html>',
  ].join('');
}

function normalizeAssetKey(value: string): string {
  return (value
    .split(/[?#]/)[0] ?? value)
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .toLowerCase();
}

function buildAssetIndex(assets: Map<string, Blob>): Map<string, Blob> {
  const index = new Map<string, Blob>();

  for (const [key, blob] of assets) {
    const normalized = normalizeAssetKey(key);
    index.set(normalized, blob);

    const segments = normalized.split('/');
    const fileName = segments[segments.length - 1];
    if (fileName) {
      index.set(fileName, blob);
    }
  }

  return index;
}

function isRelativeHref(href: string): boolean {
  return !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//');
}

async function inlineLinkedStylesheets(
  segment: string,
  assets: Map<string, Blob>,
): Promise<string> {
  const assetIndex = assets.size > 0 ? buildAssetIndex(assets) : new Map<string, Blob>();
  const parser = new DOMParser();
  const doc = parser.parseFromString(ensureFullHtml(segment), 'text/html');

  const stylesheetLinks = doc.querySelectorAll('link[rel="stylesheet"][href]');
  for (const link of stylesheetLinks) {
    const href = link.getAttribute('href');
    if (!href) {
      continue;
    }

    // First try the uploaded assets map
    const asset = assetIndex.get(normalizeAssetKey(href));
    if (asset) {
      const cssText = await readAssetText(asset);
      const styleEl = doc.createElement('style');
      styleEl.setAttribute('data-inline-source', href);
      styleEl.textContent = cssText;
      link.replaceWith(styleEl);
      continue;
    }

    // For relative links not in assets, try fetching from the server
    // (covers cases where the CSS wasn't uploaded alongside the HTML)
    if (isRelativeHref(href) && isBrowserRuntime()) {
      try {
        const response = await fetch(href, { cache: 'no-store' });
        if (response.ok) {
          const cssText = await response.text();
          const styleEl = doc.createElement('style');
          styleEl.setAttribute('data-inline-source', href);
          styleEl.textContent = cssText;
          link.replaceWith(styleEl);
        }
      } catch {
        // Silently skip — CSS will not be available
      }
    }
  }

  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

async function readAssetText(asset: Blob): Promise<string> {
  const textReader = (asset as Blob & { text?: () => Promise<string> }).text;
  if (typeof textReader === 'function') {
    return textReader.call(asset);
  }

  const bufferReader = (asset as Blob & {
    arrayBuffer?: () => Promise<ArrayBuffer>;
  }).arrayBuffer;
  if (typeof bufferReader === 'function') {
    const buffer = await bufferReader.call(asset);
    return new TextDecoder().decode(buffer);
  }

  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : '');
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error('Unable to read stylesheet asset'));
      };
      reader.readAsText(asset);
    });
  }

  return '';
}

// ---------------------------------------------------------------------------
// CSS-to-inline resolver for jsdom/DOMParser mode
// jsdom does not cascade <style> rules via getComputedStyle, so we manually
// resolve CSS selectors + var() references and stamp them as inline styles.
// ---------------------------------------------------------------------------

interface ParsedCssRule {
  selector: string;
  properties: Map<string, string>;
  specificity: number;
}

function computeSpecificity(selector: string): number {
  // Simple specificity: count IDs (#), classes/attrs (.), and elements
  const ids = (selector.match(/#[a-zA-Z][\w-]*/g) ?? []).length;
  const classes = (selector.match(/\.[a-zA-Z][\w-]*/g) ?? []).length
    + (selector.match(/\[[^\]]+\]/g) ?? []).length
    + (selector.match(/:[a-zA-Z][\w-]*/g) ?? []).length;
  const elements = (selector.match(/(^|[\s>+~])([a-zA-Z][\w-]*)/g) ?? []).length;
  return ids * 100 + classes * 10 + elements;
}

function parseCssRules(cssText: string): { rules: ParsedCssRule[]; customProperties: Map<string, string> } {
  const rules: ParsedCssRule[] = [];
  const customProperties = new Map<string, string>();

  // Strip comments
  const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip @media and other at-rules (we take inner rules for simplicity)
  const withoutAtRules = cleaned.replace(/@media[^{]*\{([\s\S]*?)\}\s*\}/g, '$1');

  // Match rule blocks: selector { declarations }
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(withoutAtRules)) !== null) {
    const selectorGroup = (match[1] ?? '').trim();
    const declarations = (match[2] ?? '').trim();
    if (!selectorGroup || !declarations) continue;

    const properties = new Map<string, string>();
    for (const decl of declarations.split(';')) {
      const colonIdx = decl.indexOf(':');
      if (colonIdx <= 0) continue;
      const prop = decl.slice(0, colonIdx).trim().toLowerCase();
      const val = decl.slice(colonIdx + 1).trim().replace(/\s*!important\s*$/, '');
      if (prop && val) {
        if (prop.startsWith('--')) {
          customProperties.set(prop, val);
        } else {
          properties.set(prop, val);
        }
      }
    }

    if (properties.size === 0 && selectorGroup !== ':root') continue;

    // Handle comma-separated selectors
    for (const sel of selectorGroup.split(',')) {
      const trimmed = sel.trim();
      if (!trimmed || trimmed === ':root') continue;
      rules.push({
        selector: trimmed,
        properties: new Map(properties),
        specificity: computeSpecificity(trimmed),
      });
    }
  }

  // Sort by specificity (lower first, so higher specificity overwrites)
  rules.sort((a, b) => a.specificity - b.specificity);

  return { rules, customProperties };
}

function resolveVarReferences(value: string, customProperties: Map<string, string>, depth = 0): string {
  if (depth > 10 || !value.includes('var(')) return value;

  return value.replace(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*([^)]*))?\)/g, (_match, name: string, fallback?: string) => {
    const resolved = customProperties.get(name);
    if (resolved !== undefined) {
      return resolveVarReferences(resolved, customProperties, depth + 1);
    }
    if (fallback !== undefined) {
      return resolveVarReferences(fallback.trim(), customProperties, depth + 1);
    }
    return '';
  });
}

// CSS properties that are inherited by default in the cascade
const INHERITED_PROPERTIES = new Set([
  'color', 'font-family', 'font-size', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'text-decoration-line', 'text-transform',
  'line-height', 'letter-spacing', 'text-shadow', 'opacity',
]);

// Expand CSS border shorthands into longhand properties
function expandBorderShorthands(props: Map<string, string>): void {
  // border: <width> <style> <color>
  const border = props.get('border');
  if (border) {
    const parts = parseBorderShorthand(border);
    if (parts.width && !props.has('border-width')) props.set('border-width', parts.width);
    if (parts.style && !props.has('border-style')) props.set('border-style', parts.style);
    if (parts.color && !props.has('border-color')) props.set('border-color', parts.color);
    props.delete('border');
  }

  // border-left / border-right / border-top / border-bottom
  for (const side of ['left', 'right', 'top', 'bottom']) {
    const shorthand = props.get(`border-${side}`);
    if (shorthand) {
      const parts = parseBorderShorthand(shorthand);
      if (parts.width && !props.has(`border-${side}-width`)) props.set(`border-${side}-width`, parts.width);
      if (parts.style && !props.has(`border-${side}-style`)) props.set(`border-${side}-style`, parts.style);
      if (parts.color && !props.has(`border-${side}-color`)) props.set(`border-${side}-color`, parts.color);
      props.delete(`border-${side}`);
    }
  }
}

function parseBorderShorthand(value: string): { width?: string; style?: string; color?: string } {
  const borderStyles = new Set(['none', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'hidden']);
  const parts = value.trim().split(/\s+/);
  let width: string | undefined;
  let style: string | undefined;
  let color: string | undefined;

  for (const part of parts) {
    if (borderStyles.has(part)) {
      style = part;
    } else if (/^(\d+(?:\.\d+)?)(px|em|rem|pt)?$/.test(part) || part === '0' || part === 'thin' || part === 'medium' || part === 'thick') {
      width = part;
    } else {
      color = part;
    }
  }

  return { width, style, color };
}

function applyStylesToInline(doc: Document): void {
  // Collect all <style> block text
  const styleElements = doc.querySelectorAll('style');
  let allCss = '';
  for (const el of styleElements) {
    allCss += (el.textContent ?? '') + '\n';
  }
  if (allCss.trim().length === 0) return;

  const { rules, customProperties } = parseCssRules(allCss);

  // Collect inherited properties from body/html rules
  const inheritedDefaults = new Map<string, string>();
  for (const rule of rules) {
    if (rule.selector === 'body' || rule.selector === 'html') {
      for (const [prop, rawVal] of rule.properties) {
        if (INHERITED_PROPERTIES.has(prop)) {
          const resolved = resolveVarReferences(rawVal, customProperties);
          if (resolved && resolved.length > 0) {
            inheritedDefaults.set(prop, resolved);
          }
        }
      }
    }
  }

  // Walk all elements and apply matching rules
  const bodyEl = doc.body;
  if (!bodyEl) return;
  const allElements = bodyEl.querySelectorAll('*');

  for (const element of allElements) {
    const matched = new Map<string, string>();

    for (const rule of rules) {
      try {
        if (element.matches(rule.selector)) {
          for (const [prop, val] of rule.properties) {
            matched.set(prop, val);
          }
        }
      } catch {
        // Invalid selector — skip silently
      }
    }

    // Apply inherited defaults for properties not explicitly matched
    for (const [prop, val] of inheritedDefaults) {
      if (!matched.has(prop)) {
        matched.set(prop, val);
      }
    }

    // Parse existing inline styles, resolve any var() references in them
    const existing = element.getAttribute('style') ?? '';
    const existingProps = new Set<string>();
    const resolvedExisting: string[] = [];
    let inlineHadVars = false;

    for (const decl of existing.split(';')) {
      const colonIdx = decl.indexOf(':');
      if (colonIdx > 0) {
        const prop = decl.slice(0, colonIdx).trim().toLowerCase();
        let val = decl.slice(colonIdx + 1).trim();
        existingProps.add(prop);
        // Resolve var() references in existing inline styles
        if (val.includes('var(') && customProperties.size > 0) {
          val = resolveVarReferences(val, customProperties);
          inlineHadVars = true;
        }
        if (prop && val) {
          resolvedExisting.push(`${prop}: ${val}`);
        }
      }
    }

    if (matched.size === 0 && !inlineHadVars) continue;

    // Resolve var() references in matched CSS rules
    const resolvedMatched = new Map<string, string>();
    for (const [prop, rawVal] of matched) {
      const resolved = resolveVarReferences(rawVal, customProperties);
      if (resolved && resolved.length > 0) {
        resolvedMatched.set(prop, resolved);
      }
    }

    // Expand border shorthands into longhand properties
    expandBorderShorthands(resolvedMatched);

    // Merge: existing inline styles take priority over CSS rules
    const newDeclarations: string[] = [];

    for (const [prop, resolved] of resolvedMatched) {
      // Don't overwrite existing inline styles (they have higher specificity)
      if (existingProps.has(prop)) continue;
      newDeclarations.push(`${prop}: ${resolved}`);
    }

    if (newDeclarations.length > 0 || inlineHadVars) {
      const allDeclarations = [...resolvedExisting, ...newDeclarations];
      element.setAttribute('style', allDeclarations.join('; '));
    }
  }
}

async function parseSegmentsWithDomParser(
  segments: string[],
  assets: Map<string, Blob>,
): Promise<RenderResult> {
  const parser = new DOMParser();
  const documents: Document[] = [];

  for (const segment of segments) {
    const withInlineStyles = await inlineLinkedStylesheets(segment, assets);
    const html = ensureFullHtml(withInlineStyles);
    const doc = parser.parseFromString(html, 'text/html');

    // In jsdom/DOMParser mode, cascade CSS rules into inline styles
    // since jsdom's getComputedStyle doesn't resolve class-based rules
    applyStylesToInline(doc);

    documents.push(doc);
  }

  return { documents };
}

function createOffscreenFrame(
  width: number,
  height: number,
): HTMLIFrameElement {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  frame.style.position = 'fixed';
  frame.style.left = '-10000px';
  frame.style.top = '0';
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.visibility = 'hidden';
  frame.style.pointerEvents = 'none';
  frame.style.opacity = '0';
  frame.style.border = '0';
  return frame;
}

function waitForLayout(frameWindow: Window): Promise<void> {
  return new Promise((resolve) => {
    // Wait for stylesheets to load, then settle layout with rAF
    const doc = frameWindow.document;
    const pendingLinks = doc.querySelectorAll('link[rel="stylesheet"]');
    const linkPromises: Promise<void>[] = [];

    for (const link of pendingLinks) {
      linkPromises.push(
        new Promise<void>((res) => {
          if ((link as HTMLLinkElement).sheet) {
            res();
            return;
          }
          link.addEventListener('load', () => res(), { once: true });
          link.addEventListener('error', () => res(), { once: true });
        }),
      );
    }

    // Wait for all stylesheets (with a timeout), then settle with 2x rAF
    const stylesheetTimeout = new Promise<void>((res) => setTimeout(res, 3000));
    Promise.race([Promise.all(linkPromises), stylesheetTimeout]).then(() => {
      frameWindow.requestAnimationFrame(() => {
        frameWindow.requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  });
}

async function renderSegmentsInIframes(
  segments: string[],
  options: ConversionOptions,
  assets: Map<string, Blob>,
): Promise<RenderResult> {
  const frames: HTMLIFrameElement[] = [];
  const documents: Document[] = [];

  for (const segment of segments) {
    const frame = createOffscreenFrame(options.slideWidth, options.slideHeight);
    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument;
    const frameWindow = frame.contentWindow;
    if (!frameDoc || !frameWindow) {
      frame.remove();
      throw new Error('Unable to initialize render iframe');
    }

    const withInlineStyles = await inlineLinkedStylesheets(segment, assets);
    frameDoc.open();
    frameDoc.write(ensureFullHtml(withInlineStyles));
    frameDoc.close();

    await waitForLayout(frameWindow);

    frames.push(frame);
    documents.push(frameDoc);
  }

  return {
    documents,
    cleanup: () => {
      for (const frame of frames) {
        frame.remove();
      }
    },
  };
}

/**
 * Public API: inline external `<link rel="stylesheet">` tags into the HTML
 * using the provided assets map. Useful for embedding CSS before displaying
 * HTML in a sandboxed iframe (e.g., the comparison slider).
 */
export async function inlineCssIntoHtml(
  html: string,
  assets: Map<string, Blob>,
): Promise<string> {
  return inlineLinkedStylesheets(html, assets);
}
