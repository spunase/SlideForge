/**
 * Analyze stage — maps ExtractedElements to MappedShapes using the style mappers.
 */

import type { ExtractedElement, MappedShape, ConversionWarning } from '../../types';
import { mapElement } from '../../styles';

export interface AnalyzeResult {
  slides: MappedShape[][];
  warnings: ConversionWarning[];
}

function hasVisualContainerStyles(computedStyles: Record<string, string>): boolean {
  const backgroundColor = computedStyles['background-color'] ?? '';
  const hasBackground =
    backgroundColor.length > 0 &&
    backgroundColor !== 'transparent' &&
    backgroundColor !== 'rgba(0, 0, 0, 0)';

  const backgroundImage = computedStyles['background-image'] ?? '';
  const hasBackgroundImage =
    backgroundImage.length > 0 && backgroundImage !== 'none';

  const borderWidth = computedStyles['border-width'] ?? computedStyles['border-top-width'] ?? '';
  const borderStyle = computedStyles['border-style'] ?? computedStyles['border-top-style'] ?? '';
  const hasBorder =
    borderWidth !== '0px' &&
    borderWidth !== '0' &&
    borderStyle !== 'none' &&
    borderStyle.length > 0;

  const hasShadow =
    (computedStyles['box-shadow'] ?? '') !== '' &&
    computedStyles['box-shadow'] !== 'none';

  return hasBackground || hasBackgroundImage || hasBorder || hasShadow;
}

/**
 * Flatten an ExtractedElement tree into meaningful shapes:
 * - direct text nodes
 * - images
 * - visual container blocks (backgrounds/borders/shadows)
 */
function flattenElements(elements: ExtractedElement[]): ExtractedElement[] {
  const result: ExtractedElement[] = [];

  for (const el of elements) {
    const hasOwnText = el.textContent !== null && el.textContent.trim().length > 0;
    const isImage = el.tagName === 'img';
    const isVisualContainer = hasVisualContainerStyles(el.computedStyles);
    const hasRenderableGeometry = el.geometry.width > 0 && el.geometry.height > 0;

    if ((hasOwnText || isImage || isVisualContainer) && hasRenderableGeometry) {
      result.push(el);
    }

    if (el.children.length > 0) {
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
