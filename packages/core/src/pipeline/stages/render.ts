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

async function inlineLinkedStylesheets(
  segment: string,
  assets: Map<string, Blob>,
): Promise<string> {
  if (assets.size === 0) {
    return segment;
  }

  const assetIndex = buildAssetIndex(assets);
  const parser = new DOMParser();
  const doc = parser.parseFromString(ensureFullHtml(segment), 'text/html');

  const stylesheetLinks = doc.querySelectorAll('link[rel="stylesheet"][href]');
  for (const link of stylesheetLinks) {
    const href = link.getAttribute('href');
    if (!href) {
      continue;
    }

    const asset = assetIndex.get(normalizeAssetKey(href));
    if (!asset) {
      continue;
    }

    const cssText = await readAssetText(asset);
    const styleEl = doc.createElement('style');
    styleEl.setAttribute('data-inline-source', href);
    styleEl.textContent = cssText;
    link.replaceWith(styleEl);
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
    frameWindow.requestAnimationFrame(() => {
      frameWindow.requestAnimationFrame(() => {
        resolve();
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
