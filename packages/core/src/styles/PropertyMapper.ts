/**
 * Orchestrating facade that combines all sub-mappers to produce
 * a complete MappedShape from an ExtractedElement.
 *
 * This is the primary entry point for CSS-to-DrawingML style mapping.
 */

import type {
  MappedShape,
  ConversionWarning,
  FillStyle,
} from '../types/styles';
import type { ExtractedElement } from '../types/conversion';
import { mapTextStyle } from './TextStyleMapper';
import { mapBackground } from './BackgroundMapper';
import { mapBorder } from './BorderMapper';
import { mapShadow } from './ShadowMapper';
import { mapGradient } from './GradientMapper';
import { mapPosition } from './PositionMapper';
import { classifyProperty } from './TierClassifier';

/**
 * Maps an ExtractedElement (with computed CSS styles) to a MappedShape
 * ready for PPTX DrawingML generation.
 *
 * Orchestrates all sub-mappers and collects warnings.
 *
 * @param element - The extracted DOM element with computed styles
 * @param slideWidth - The slide width in pixels
 * @param slideHeight - The slide height in pixels
 * @returns A complete MappedShape with geometry, styles, and warnings
 */
export function mapElement(
  element: ExtractedElement,
  slideWidth: number,
  slideHeight: number
): MappedShape {
  const warnings: ConversionWarning[] = [];
  const computed = element.computedStyles;

  // --- Classify and warn about Tier C properties ---
  for (const [property, value] of Object.entries(computed)) {
    const tier = classifyProperty(property, value);
    if (tier === 'C') {
      warnings.push({
        code: 'SF-CSS-002',
        severity: 'medium',
        property,
        message: `CSS property "${property}" is Tier C (unsupported) and will be skipped`,
        original: value,
      });
    }
  }

  // --- Position / Geometry ---
  const geometry = mapPosition(element.geometry, slideWidth, slideHeight);

  // --- Background / Fill ---
  let fill: FillStyle;
  const bgImage = computed['background-image'] || '';
  const background = computed['background'] || '';

  // Check if there's a gradient in background-image or shorthand background
  const gradientSource = bgImage.includes('gradient')
    ? bgImage
    : background.includes('gradient')
      ? background
      : '';

  if (gradientSource.length > 0) {
    const gradientResult = mapGradient(gradientSource);
    fill = gradientResult.fill;
    warnings.push(...gradientResult.warnings);
  } else {
    const bgResult = mapBackground(computed);
    fill = bgResult.fill;
    warnings.push(...bgResult.warnings);
  }

  // --- Border ---
  const borderResult = mapBorder(computed);
  const border = borderResult.border;
  warnings.push(...borderResult.warnings);

  // --- Shadow ---
  const shadowResult = mapShadow(computed);
  const shadow = shadowResult.shadow;
  warnings.push(...shadowResult.warnings);

  // --- Text Style ---
  let textStyle = null;
  if (element.textContent && element.textContent.trim().length > 0) {
    const textResult = mapTextStyle(computed);
    textStyle = textResult.textStyle;
    warnings.push(...textResult.warnings);
  }

  return {
    geometry,
    fill,
    border,
    shadow,
    textStyle,
    textContent: element.textContent,
    imageUrl: element.imageUrl ?? null,
    warnings,
  };
}
