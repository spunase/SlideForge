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
  'text-transform',
  'line-height',
  'letter-spacing',
  'background',
  'background-color',
  'background-image',
  'border',
  'border-left',
  'border-right',
  'border-top',
  'border-bottom',
  'border-width',
  'border-top-width',
  'border-left-width',
  'border-right-width',
  'border-bottom-width',
  'border-style',
  'border-top-style',
  'border-left-style',
  'border-right-style',
  'border-bottom-style',
  'border-color',
  'border-top-color',
  'border-left-color',
  'border-right-color',
  'border-bottom-color',
  'border-radius',
  'border-top-left-radius',
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

// ---------------------------------------------------------------------------
// Layout context for fallback geometry estimation
// ---------------------------------------------------------------------------

interface LayoutSlot {
  x: number;
  y: number;
  width: number;
}

function parsePxValue(style: string, property: string): number | undefined {
  const re = new RegExp(`(?:^|;|\\s)${property}:\\s*(\\d+(?:\\.\\d+)?)px`, 'i');
  const m = style.match(re);
  return m?.[1] ? Number.parseFloat(m[1]) : undefined;
}

function parseStyleProp(style: string, property: string): string | undefined {
  const re = new RegExp(`(?:^|;|\\s)${property}:\\s*([^;]+)`, 'i');
  const m = style.match(re);
  return m?.[1]?.trim();
}

// HTML elements that use horizontal (row) layout by default via UA styles
const TABLE_ROW_TAGS = new Set(['tr', 'thead', 'tbody', 'tfoot']);

/**
 * Determine the layout direction for an element based on its inline styles
 * and tag name (for table elements whose display comes from UA defaults).
 * Returns 'row' for horizontal flex/grid/table-row, 'column' for vertical stacking.
 */
function getLayoutDirection(style: string, tagName?: string): 'row' | 'column' {
  // Table rows distribute cells horizontally regardless of inline style
  if (tagName && TABLE_ROW_TAGS.has(tagName)) return 'row';

  const display = parseStyleProp(style, 'display');

  if (display === 'table-row') return 'row';
  if (display === 'table' || display === 'inline-table') return 'column'; // rows stack vertically

  if (!display) return 'column';

  if (display === 'flex' || display === 'inline-flex') {
    const direction = parseStyleProp(style, 'flex-direction');
    return direction === 'column' ? 'column' : 'row';
  }

  if (display === 'grid' || display === 'inline-grid') {
    const cols = parseStyleProp(style, 'grid-template-columns');
    // Grid with column template → horizontal layout
    if (cols && cols !== 'none') return 'row';
  }

  return 'column';
}

/**
 * Parse grid-template-columns into fractional ratios.
 * Handles: "2fr 1fr", "repeat(auto-fit, minmax(200px, 1fr))", "1fr 1fr 1fr"
 */
function parseGridColumns(template: string, childCount: number): number[] {
  // Handle repeat(auto-fit, ...) → distribute evenly
  if (template.includes('repeat') && template.includes('auto-fit')) {
    return Array(childCount).fill(1);
  }

  // Parse "Nfr" tokens
  const frValues: number[] = [];
  const tokens = template.split(/\s+/);
  for (const token of tokens) {
    const frMatch = token.match(/^(\d+(?:\.\d+)?)fr$/);
    if (frMatch?.[1]) {
      frValues.push(Number.parseFloat(frMatch[1]));
    } else {
      frValues.push(1); // Non-fr values treated as equal share
    }
  }

  return frValues.length > 0 ? frValues : Array(childCount).fill(1);
}

/**
 * Compute layout slots for children based on parent layout.
 */
function computeChildSlots(
  parentX: number,
  parentY: number,
  parentWidth: number,
  childCount: number,
  style: string,
  tagName?: string,
): LayoutSlot[] {
  if (childCount === 0) return [];

  const direction = getLayoutDirection(style, tagName);
  const gap = parsePxValue(style, 'gap') ?? 0;
  const padding = parsePxValue(style, 'padding') ?? 0;
  const contentWidth = parentWidth - padding * 2;
  const contentX = parentX + padding;
  const contentY = parentY + padding;

  if (direction === 'row') {
    // Horizontal distribution
    const display = parseStyleProp(style, 'display');
    let ratios: number[];

    if (display === 'grid' || display === 'inline-grid') {
      const cols = parseStyleProp(style, 'grid-template-columns') ?? '';
      ratios = parseGridColumns(cols, childCount);
    } else {
      // Flex row: equal distribution
      ratios = Array(childCount).fill(1);
    }

    // Extend ratios to match child count (wrap grid rows)
    while (ratios.length < childCount) {
      ratios.push(ratios[ratios.length - 1] ?? 1);
    }

    const totalGap = gap * (Math.min(ratios.length, childCount) - 1);
    const totalFr = ratios.reduce((sum, r) => sum + r, 0);
    const availableWidth = contentWidth - totalGap;

    const slots: LayoutSlot[] = [];
    let currentX = contentX;
    const colCount = ratios.length;

    for (let i = 0; i < childCount; i++) {
      const colIndex = i % colCount;
      const row = Math.floor(i / colCount);

      if (colIndex === 0 && row > 0) {
        currentX = contentX;
      }

      const colWidth = (ratios[colIndex]! / totalFr) * availableWidth;
      slots.push({
        x: currentX,
        y: contentY + row * 200, // Estimate 200px per grid row
        width: colWidth,
      });
      currentX += colWidth + gap;
    }

    return slots;
  }

  // Column (vertical) distribution — all children get full width
  return Array(childCount).fill(null).map(() => ({
    x: contentX,
    y: 0, // Will be computed during walk
    width: contentWidth,
  }));
}

/**
 * Create a fallback geometry estimate for non-browser or jsdom environments.
 */
function estimateGeometry(
  element: Element,
  slot: LayoutSlot,
  elementIndex: number,
  parentY: number,
): ElementGeometry {
  const tagName = element.tagName.toLowerCase();
  let width = slot.width;
  let height = 40;
  let x = slot.x;
  let y = slot.y > 0 ? slot.y : parentY;

  const style = element.getAttribute('style') || '';
  const explicitWidth = parsePxValue(style, 'width');
  const explicitHeight = parsePxValue(style, 'height');
  const leftVal = parsePxValue(style, 'left');
  const topVal = parsePxValue(style, 'top');

  // Respect max-width constraint
  const maxWidth = parsePxValue(style, 'max-width');
  if (maxWidth && maxWidth < width) {
    // Center element within parent when max-width constrains it (margin: 0 auto pattern)
    const marginAuto = parseStyleProp(style, 'margin');
    if (marginAuto && marginAuto.includes('auto')) {
      x = x + (width - maxWidth) / 2;
    }
    width = maxWidth;
  }

  if (explicitWidth) {
    width = Math.min(explicitWidth, width);
  }
  if (explicitHeight) {
    height = explicitHeight;
  }

  if (leftVal !== undefined) {
    x = leftVal;
  }
  if (topVal !== undefined) {
    y = topVal;
  } else if (slot.y <= 0) {
    y = parentY;
  }

  if (/^h[1-6]$/.test(tagName)) {
    const level = Number.parseInt(tagName.charAt(1), 10);
    height = Math.max(height, 60 - (level - 1) * 6);
  }

  if (tagName === 'img') {
    if (!explicitWidth) width = Math.min(400, width);
    if (!explicitHeight) height = 300;
  }

  const zIndexMatch = style.match(/z-index:\s*(-?\d+)/);
  const zIndex = zIndexMatch?.[1] ? Number.parseInt(zIndexMatch[1], 10) : 0;

  return { x, y, width, height, zIndex };
}

function walkElementFallback(
  element: Element,
  slideIndex: number,
  slot: LayoutSlot,
  elementIndex: number,
  parentY: number,
): ExtractedElement {
  const tagName = element.tagName.toLowerCase();
  const geometry = estimateGeometry(element, slot, elementIndex, parentY);
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
  const childCount = element.children.length;
  const style = element.getAttribute('style') || '';
  const childSlots = computeChildSlots(
    geometry.x,
    geometry.y,
    geometry.width,
    childCount,
    style,
    tagName,
  );

  let childY = geometry.y;

  for (let i = 0; i < childCount; i++) {
    const child = element.children.item(i);
    if (!child) {
      continue;
    }

    const childSlot = childSlots[i] ?? { x: geometry.x, y: 0, width: geometry.width };
    // For column layout, update Y progressively; for row, use slot's Y
    if (childSlot.y <= 0) {
      childSlot.y = childY;
    }

    const extractedChild = walkElementFallback(
      child,
      slideIndex,
      childSlot,
      i,
      childSlot.y,
    );
    children.push(extractedChild);

    // Only advance Y for column layouts
    const direction = getLayoutDirection(style, tagName);
    if (direction === 'column') {
      childY = extractedChild.geometry.y + extractedChild.geometry.height;
    } else {
      // For row layouts, track max height for the current row
      const colCount = childSlots.length > 0
        ? Math.min(childSlots.length, childCount)
        : childCount;
      const isLastInRow = (i + 1) % colCount === 0 || i === childCount - 1;
      if (isLastInRow) {
        // Find max height in this row
        const rowStart = Math.floor(i / colCount) * colCount;
        let maxH = 0;
        for (let j = rowStart; j <= i; j++) {
          const c = children[j];
          if (c) {
            maxH = Math.max(maxH, c.geometry.height);
          }
        }
        const gap = parsePxValue(style, 'gap') ?? 0;
        childY = (children[rowStart]?.geometry.y ?? childY) + maxH + gap;
      }
    }
  }

  // Update element height to encompass all children
  if (children.length > 0) {
    const lastChild = children[children.length - 1]!;
    const childrenBottom = lastChild.geometry.y + lastChild.geometry.height;
    const padding = parsePxValue(style, 'padding') ?? 0;
    const computedHeight = childrenBottom - geometry.y + padding;
    geometry.height = Math.max(geometry.height, computedHeight);
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

        const slot: LayoutSlot = { x: 0, y: 0, width: slideWidth };
        const extracted = walkElementFallback(
          child,
          slideIndex,
          slot,
          i,
          currentY,
        );
        elements.push(extracted);
        currentY = extracted.geometry.y + extracted.geometry.height;
      }
    }

    slides.push(elements);
  }

  return { slides };
}
