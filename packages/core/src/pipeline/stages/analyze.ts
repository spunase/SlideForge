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
  const backgroundShorthand = computedStyles['background'] ?? '';

  const isNonTransparent = (v: string) =>
    v.length > 0 &&
    v !== 'transparent' &&
    v !== 'rgba(0, 0, 0, 0)' &&
    v !== 'none' &&
    v !== 'initial' &&
    v !== 'inherit';

  const hasBackground =
    isNonTransparent(backgroundColor) || isNonTransparent(backgroundShorthand);

  const backgroundImage = computedStyles['background-image'] ?? '';
  const hasBackgroundImage =
    backgroundImage.length > 0 && backgroundImage !== 'none';

  const borderWidth = computedStyles['border-width']
    ?? computedStyles['border-top-width']
    ?? computedStyles['border-left-width']
    ?? computedStyles['border-right-width']
    ?? computedStyles['border-bottom-width']
    ?? '';
  const borderStyle = computedStyles['border-style']
    ?? computedStyles['border-top-style']
    ?? computedStyles['border-left-style']
    ?? computedStyles['border-right-style']
    ?? computedStyles['border-bottom-style']
    ?? '';
  const hasBorder =
    borderWidth !== '0px' &&
    borderWidth !== '0' &&
    borderWidth.length > 0 &&
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
 * Scale shapes to fill the slide when the HTML content is smaller than the
 * target slide dimensions.  Computes the bounding box of all shapes and
 * applies independent x/y scaling so the content stretches to cover the slide.
 *
 * Skips scaling when content already covers ≥ 95 % of the slide on both axes.
 */
function scaleToFitSlide(
  shapes: MappedShape[],
  slideWidth: number,
  slideHeight: number,
): void {
  if (shapes.length === 0) return;

  let maxRight = 0;
  let maxBottom = 0;
  for (const s of shapes) {
    maxRight = Math.max(maxRight, s.geometry.x + s.geometry.width);
    maxBottom = Math.max(maxBottom, s.geometry.y + s.geometry.height);
  }

  if (maxRight <= 0 || maxBottom <= 0) return;

  const ratioX = slideWidth / maxRight;
  const ratioY = slideHeight / maxBottom;

  // Skip if content already covers ≥ 95 % of the slide on both axes
  if (ratioX <= 1.05 && ratioY <= 1.05) return;

  for (const s of shapes) {
    s.geometry.x = s.geometry.x * ratioX;
    s.geometry.y = s.geometry.y * ratioY;
    s.geometry.width = s.geometry.width * ratioX;
    s.geometry.height = s.geometry.height * ratioY;
  }
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

    // Scale content to fill the slide when HTML is smaller than target dimensions
    scaleToFitSlide(mappedShapes, slideWidth, slideHeight);

    slides.push(mappedShapes);
  }

  return { slides: slides, warnings: allWarnings };
}
