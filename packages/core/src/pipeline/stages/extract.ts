/**
 * Extract stage — walks the DOM tree of each rendered slide and
 * collects ExtractedElement data for style mapping.
 */

import type { ExtractedElement, ElementGeometry } from '../../types';

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

/**
 * Create a placeholder geometry based on element position in the flow.
 * In Phase 1 (jsdom), we don't have real layout, so we estimate.
 */
function estimateGeometry(
  element: Element,
  elementIndex: number,
  parentY: number,
  slideWidth: number,
): ElementGeometry {
  const tagName = element.tagName.toLowerCase();

  // Basic heuristics for element sizing
  let width = slideWidth;
  let height = 40;
  const x = 0;
  let y = parentY;

  // Try to extract dimensions from inline styles
  const style = element.getAttribute('style') || '';
  const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)px/);
  const heightMatch = style.match(/height:\s*(\d+(?:\.\d+)?)px/);
  const leftMatch = style.match(/left:\s*(\d+(?:\.\d+)?)px/);
  const topMatch = style.match(/top:\s*(\d+(?:\.\d+)?)px/);

  if (widthMatch?.[1]) {
    width = parseFloat(widthMatch[1]);
  }
  if (heightMatch?.[1]) {
    height = parseFloat(heightMatch[1]);
  }

  const parsedX = leftMatch?.[1] ? parseFloat(leftMatch[1]) : x;
  if (topMatch?.[1]) {
    y = parseFloat(topMatch[1]);
  } else {
    y = parentY + elementIndex * height;
  }

  // Headings get more height
  if (/^h[1-6]$/.test(tagName)) {
    const level = parseInt(tagName.charAt(1), 10);
    height = Math.max(height, 60 - (level - 1) * 6);
  }

  // Images default to a reasonable size
  if (tagName === 'img') {
    if (!widthMatch) width = 400;
    if (!heightMatch) height = 300;
  }

  // Extract z-index from styles
  const zIndexMatch = style.match(/z-index:\s*(-?\d+)/);
  const zIndex = zIndexMatch?.[1] ? parseInt(zIndexMatch[1], 10) : 0;

  return { x: parsedX, y, width, height, zIndex };
}

/**
 * Recursively walk a DOM element and extract element data.
 */
function walkElement(
  element: Element,
  slideIndex: number,
  elementIndex: number,
  parentY: number,
  slideWidth: number,
): ExtractedElement {
  const tagName = element.tagName.toLowerCase();
  const textContent = element.textContent;
  const styleAttr = element.getAttribute('style');
  const computedStyles = parseInlineStyles(styleAttr);
  const geometry = estimateGeometry(element, elementIndex, parentY, slideWidth);

  // Check for image URL
  let imageUrl: string | undefined;
  if (tagName === 'img') {
    const src = element.getAttribute('src');
    if (src) {
      imageUrl = src;
    }
  }

  // Recurse into children
  const children: ExtractedElement[] = [];
  const childElements = element.children;
  let childY = geometry.y;

  for (let i = 0; i < childElements.length; i++) {
    const child = childElements[i];
    if (!child) continue;
    const childExtracted = walkElement(child, slideIndex, i, childY, slideWidth);
    children.push(childExtracted);
    childY = childExtracted.geometry.y + childExtracted.geometry.height;
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
 * Extract elements from parsed slide documents.
 *
 * @param documents - Parsed DOM documents, one per slide
 * @param slideWidth - The slide width in pixels for geometry estimation
 * @returns Arrays of ExtractedElement per slide
 */
export function extract(documents: Document[], slideWidth: number): ExtractResult {
  const slides: ExtractedElement[][] = [];

  for (let slideIndex = 0; slideIndex < documents.length; slideIndex++) {
    const doc = documents[slideIndex];
    if (!doc) continue;
    const body = doc.body;
    const elements: ExtractedElement[] = [];

    if (body) {
      const childElements = body.children;
      let currentY = 0;

      for (let i = 0; i < childElements.length; i++) {
        const child = childElements[i];
        if (!child) continue;
        const extracted = walkElement(child, slideIndex, i, currentY, slideWidth);
        elements.push(extracted);
        currentY = extracted.geometry.y + extracted.geometry.height;
      }
    }

    slides.push(elements);
  }

  return { slides };
}
