/**
 * SlideSegmenter — splits an HTML document into individual slide segments.
 *
 * Uses priority-ordered detection:
 * 1. Elements with `data-slide` attribute
 * 2. Elements with class `slide`
 * 3. Top-level `<section>` elements
 * 4. Fallback: entire body as single slide (with warning)
 */

import type { ConversionWarning } from '../types';

function serializeSegmentWithHead(doc: Document, bodyContent: string): string {
  return [
    '<!doctype html>',
    '<html>',
    `<head>${doc.head?.innerHTML ?? ''}</head>`,
    `<body>${bodyContent}</body>`,
    '</html>',
  ].join('');
}

function buildSegment(doc: Document, element: Element): string {
  return serializeSegmentWithHead(doc, element.outerHTML);
}

/**
 * Segment an HTML string into individual slide HTML fragments.
 *
 * @param html - The full HTML string to segment
 * @returns An object with slide segment strings and any warnings
 */
export function segmentSlides(html: string): {
  segments: string[];
  warnings: ConversionWarning[];
} {
  const warnings: ConversionWarning[] = [];

  if (!html || html.trim().length === 0) {
    return { segments: [], warnings };
  }

  // Wrap HTML in a body if it doesn't have one, so DOMParser can parse it
  const wrappedHtml = html.includes('<body')
    ? html
    : `<html><body>${html}</body></html>`;

  const parser = new DOMParser();
  const doc = parser.parseFromString(wrappedHtml, 'text/html');
  const body = doc.body;

  if (!body) {
    return { segments: [], warnings };
  }

  // Priority 1: Elements with data-slide attribute
  const dataSlideElements = body.querySelectorAll('[data-slide]');
  if (dataSlideElements.length > 0) {
    const segments: string[] = [];
    dataSlideElements.forEach((el) => {
      segments.push(buildSegment(doc, el as Element));
    });
    return { segments, warnings };
  }

  // Priority 2: Elements with class "slide"
  const slideClassElements = body.querySelectorAll('.slide');
  if (slideClassElements.length > 0) {
    const segments: string[] = [];
    slideClassElements.forEach((el) => {
      segments.push(buildSegment(doc, el as Element));
    });
    return { segments, warnings };
  }

  // Priority 3: Top-level <section> elements
  const sectionElements = body.querySelectorAll(':scope > section');
  if (sectionElements.length > 0) {
    const segments: string[] = [];
    sectionElements.forEach((el) => {
      segments.push(buildSegment(doc, el as Element));
    });
    return { segments, warnings };
  }

  // Priority 4: Fallback — entire body content as a single slide
  warnings.push({
    code: 'SF-CSS-002',
    severity: 'medium',
    property: 'slide-segmentation',
    message:
      'No slide markers found (data-slide, .slide, or <section>). Treating entire content as a single slide.',
  });

  return {
    segments: [serializeSegmentWithHead(doc, body.innerHTML)],
    warnings,
  };
}
