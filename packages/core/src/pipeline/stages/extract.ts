/**
 * Extract stage — walks each rendered slide DOM and collects extracted elements.
 *
 * Browser mode uses computed styles + bounding boxes for class-based styling.
 * Test/Node mode falls back to inline style parsing and estimated geometry.
 */

import type { ExtractedElement, ElementGeometry } from '../../types';

const TRACKED_STYLE_PROPERTIES = [
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-decoration-line',
  'text-align',
  'line-height',
  'letter-spacing',
  'background',
  'background-color',
  'background-image',
  'border-width',
  'border-top-width',
  'border-style',
  'border-top-style',
  'border-color',
  'border-top-color',
  'border-radius',
  'box-shadow',
  'text-shadow',
  'opacity',
  'display',
  'position',
  'z-index',
  'left',
  'top',
  'width',
  'height',
  'transform',
  'filter',
  'mix-blend-mode',
];

interface RootOffset {
  left: number;
  top: number;
}

/**
 * Parse inline style string into a key-value record.
 */
function parseInlineStyles(styleAttr: string | null): Record<string, string> {
  const styles: Record<string, string> = {};
  if (!styleAttr || styleAttr.trim().length === 0) {
    return styles;
  }

  const declarations = styleAttr.split(';');
  for (const decl of declarations) {
    const colonIndex = decl.indexOf(':');
    if (colonIndex > 0) {
      const property = decl.slice(0, colonIndex).trim().toLowerCase();
      const value = decl.slice(colonIndex + 1).trim();
      if (property.length > 0 && value.length > 0) {
        styles[property] = value;
      }
    }
  }

  return styles;
}

function isJsDomRuntime(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.userAgent === 'string' &&
    navigator.userAgent.toLowerCase().includes('jsdom')
  );
}

function canUseComputedStyles(doc: Document): boolean {
  return (
    !isJsDomRuntime() &&
    !!doc.defaultView &&
    typeof doc.defaultView.getComputedStyle === 'function'
  );
}

function getOwnTextContent(element: Element): string | null {
  const parts: string[] = [];

  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE) {
      continue;
    }

    const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (text.length > 0) {
      parts.push(text);
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(' ');
}

function parseZIndex(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickTrackedStyles(
  computed: CSSStyleDeclaration,
): Record<string, string> {
  const styles: Record<string, string> = {};

  for (const property of TRACKED_STYLE_PROPERTIES) {
    const value = computed.getPropertyValue(property).trim();
    if (value.length > 0) {
      styles[property] = value;
    }
  }

  return styles;
}

function getImageUrl(element: Element): string | undefined {
  if (element.tagName.toLowerCase() !== 'img') {
    return undefined;
  }

  const src = element.getAttribute('src');
  return src ?? undefined;
}

function getRootOffset(doc: Document): RootOffset {
  const body = doc.body;
  if (!body) {
    return { left: 0, top: 0 };
  }

  const rootElement = body.firstElementChild ?? body;
  const rootRect = rootElement.getBoundingClientRect();
  return {
    left: rootRect.left,
    top: rootRect.top,
  };
}

function createComputedGeometry(
  element: Element,
  computed: CSSStyleDeclaration,
  root: RootOffset,
): ElementGeometry {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left - root.left,
    y: rect.top - root.top,
    width: rect.width,
    height: rect.height,
    zIndex: parseZIndex(computed.getPropertyValue('z-index')),
  };
}

function walkElementComputed(
  element: Element,
  slideIndex: number,
  root: RootOffset,
): ExtractedElement | null {
  const view = element.ownerDocument.defaultView;
  if (!view) {
    return null;
  }

  const computed = view.getComputedStyle(element);
  if (computed.display === 'none') {
    return null;
  }

  const tagName = element.tagName.toLowerCase();
  const geometry = createComputedGeometry(element, computed, root);
  const textContent = getOwnTextContent(element);
  const computedStyles = pickTrackedStyles(computed);
  const imageUrl = getImageUrl(element);

  const children: ExtractedElement[] = [];
  for (const child of Array.from(element.children)) {
    const extractedChild = walkElementComputed(child, slideIndex, root);
    if (extractedChild) {
      children.push(extractedChild);
    }
  }

  return {
    tagName,
    textContent,
    geometry,
    computedStyles,
    children,
    slideIndex,
    imageUrl,
  };
}

/**
 * Create a fallback geometry estimate for non-browser or jsdom environments.
 */
function estimateGeometry(
  element: Element,
  elementIndex: number,
  parentY: number,
  slideWidth: number,
): ElementGeometry {
  const tagName = element.tagName.toLowerCase();
  let width = slideWidth;
  let height = 40;
  const x = 0;
  let y = parentY;

  const style = element.getAttribute('style') || '';
  const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)px/);
  const heightMatch = style.match(/height:\s*(\d+(?:\.\d+)?)px/);
  const leftMatch = style.match(/left:\s*(\d+(?:\.\d+)?)px/);
  const topMatch = style.match(/top:\s*(\d+(?:\.\d+)?)px/);

  if (widthMatch?.[1]) {
    width = Number.parseFloat(widthMatch[1]);
  }
  if (heightMatch?.[1]) {
    height = Number.parseFloat(heightMatch[1]);
  }

  const parsedX = leftMatch?.[1] ? Number.parseFloat(leftMatch[1]) : x;
  if (topMatch?.[1]) {
    y = Number.parseFloat(topMatch[1]);
  } else {
    y = parentY + elementIndex * height;
  }

  if (/^h[1-6]$/.test(tagName)) {
    const level = Number.parseInt(tagName.charAt(1), 10);
    height = Math.max(height, 60 - (level - 1) * 6);
  }

  if (tagName === 'img') {
    if (!widthMatch) width = 400;
    if (!heightMatch) height = 300;
  }

  const zIndexMatch = style.match(/z-index:\s*(-?\d+)/);
  const zIndex = zIndexMatch?.[1] ? Number.parseInt(zIndexMatch[1], 10) : 0;

  return { x: parsedX, y, width, height, zIndex };
}

function walkElementFallback(
  element: Element,
  slideIndex: number,
  elementIndex: number,
  parentY: number,
  slideWidth: number,
): ExtractedElement {
  const tagName = element.tagName.toLowerCase();
  const geometry = estimateGeometry(element, elementIndex, parentY, slideWidth);
  const textContent = getOwnTextContent(element);
  const inlineStyles = parseInlineStyles(element.getAttribute('style'));
  const view = element.ownerDocument.defaultView;
  const computedStyles =
    view && typeof view.getComputedStyle === 'function'
      ? {
          ...inlineStyles,
          ...pickTrackedStyles(view.getComputedStyle(element)),
        }
      : inlineStyles;
  const imageUrl = getImageUrl(element);

  const children: ExtractedElement[] = [];
  let childY = geometry.y;

  for (let i = 0; i < element.children.length; i++) {
    const child = element.children.item(i);
    if (!child) {
      continue;
    }

    const extractedChild = walkElementFallback(
      child,
      slideIndex,
      i,
      childY,
      slideWidth,
    );
    children.push(extractedChild);
    childY = extractedChild.geometry.y + extractedChild.geometry.height;
  }

  return {
    tagName,
    textContent,
    geometry,
    computedStyles,
    children,
    slideIndex,
    imageUrl,
  };
}

export interface ExtractResult {
  slides: ExtractedElement[][];
}

/**
 * Extract elements from rendered slide documents.
 *
 * @param documents - Parsed DOM documents, one per slide
 * @param slideWidth - Slide width in pixels for fallback geometry estimation
 * @returns Arrays of extracted elements per slide
 */
export function extract(documents: Document[], slideWidth: number): ExtractResult {
  const slides: ExtractedElement[][] = [];

  for (let slideIndex = 0; slideIndex < documents.length; slideIndex++) {
    const doc = documents[slideIndex];
    if (!doc?.body) {
      continue;
    }

    const elements: ExtractedElement[] = [];

    if (canUseComputedStyles(doc)) {
      const root = getRootOffset(doc);
      for (const child of Array.from(doc.body.children)) {
        const extracted = walkElementComputed(child, slideIndex, root);
        if (extracted) {
          elements.push(extracted);
        }
      }
    } else {
      let currentY = 0;
      for (let i = 0; i < doc.body.children.length; i++) {
        const child = doc.body.children.item(i);
        if (!child) {
          continue;
        }

        const extracted = walkElementFallback(
          child,
          slideIndex,
          i,
          currentY,
          slideWidth,
        );
        elements.push(extracted);
        currentY = extracted.geometry.y + extracted.geometry.height;
      }
    }

    slides.push(elements);
  }

  return { slides };
}
