/**
 * Analyze stage — maps ExtractedElements to MappedShapes using the style mappers.
 */

import type { ExtractedElement, MappedShape, ConversionWarning } from '../../types';
import { mapElement } from '../../styles';

export interface AnalyzeResult {
  slides: MappedShape[][];
  warnings: ConversionWarning[];
}

/**
 * Flatten an ExtractedElement tree into a list of leaf/meaningful elements.
 * We map elements that have direct text content (not just inherited from children)
 * or are images.
 */
function flattenElements(elements: ExtractedElement[]): ExtractedElement[] {
  const result: ExtractedElement[] = [];

  for (const el of elements) {
    // Include this element if it has meaningful content or styles
    const hasOwnText = el.textContent !== null && el.textContent.trim().length > 0;
    const isImage = el.tagName === 'img';
    const hasStyles = Object.keys(el.computedStyles).length > 0;

    if (el.children.length === 0) {
      // Leaf element — always include if it has content
      if (hasOwnText || isImage) {
        result.push(el);
      }
    } else {
      // Non-leaf: include if it has styles (like a styled container),
      // and also recurse into children
      if (hasStyles) {
        // Push a version without children's text to avoid duplication
        result.push(el);
      }
      result.push(...flattenElements(el.children));
    }
  }

  return result;
}

/**
 * Analyze extracted elements by mapping them through the style pipeline.
 *
 * @param extractedSlides - Arrays of ExtractedElement per slide
 * @param slideWidth - The slide width in pixels
 * @param slideHeight - The slide height in pixels
 * @returns MappedShape arrays per slide and collected warnings
 */
export function analyze(
  extractedSlides: ExtractedElement[][],
  slideWidth: number,
  slideHeight: number,
): AnalyzeResult {
  const allWarnings: ConversionWarning[] = [];
  const slides: MappedShape[][] = [];

  for (const elements of extractedSlides) {
    const flatElements = flattenElements(elements);
    const mappedShapes: MappedShape[] = [];

    for (const element of flatElements) {
      const shape = mapElement(element, slideWidth, slideHeight);
      allWarnings.push(...shape.warnings);
      mappedShapes.push(shape);
    }

    slides.push(mappedShapes);
  }

  return { slides: slides, warnings: allWarnings };
}
