/**
 * Maps CSS background properties to SlideForge FillStyle.
 * Tier A: solid colors. Tier C: background-image (warns and skips).
 */

import type { FillStyle, ConversionWarning } from '../types/styles';
import { normalizeColor, extractAlpha } from './CssParser';

export interface BackgroundMapResult {
  fill: FillStyle;
  warnings: ConversionWarning[];
}

/**
 * Maps CSS computed background properties to a FillStyle.
 *
 * @param computed - Record of CSS property names to their computed values
 * @returns The mapped fill style and any conversion warnings
 */
export function mapBackground(
  computed: Record<string, string>
): BackgroundMapResult {
  const warnings: ConversionWarning[] = [];

  const bgColor = computed['background-color'] || '';
  const bgImage = computed['background-image'] || computed['background'] || '';

  // Check for background-image first (Tier C for url(), handled elsewhere for gradients)
  if (bgImage && bgImage !== 'none' && bgImage !== 'initial') {
    if (bgImage.includes('url(')) {
      warnings.push({
        code: 'SF-CSS-002',
        severity: 'medium',
        property: 'background-image',
        message:
          'CSS background-image with url() is not supported in PPTX conversion; falling back to background-color or none',
        original: bgImage,
      });
      // Fall through to try background-color
    }
    // linear-gradient and radial-gradient are handled by GradientMapper
    if (bgImage.includes('gradient')) {
      // Don't handle here; PropertyMapper will delegate to GradientMapper
      // But still try to extract a background-color as base
    }
  }

  // Handle transparent / none
  if (isTransparent(bgColor)) {
    return {
      fill: { type: 'none' },
      warnings,
    };
  }

  // Handle solid color
  if (bgColor && bgColor.trim().length > 0) {
    const color = normalizeColor(bgColor);
    const alpha = extractAlpha(bgColor);

    // If alpha is 0, treat as none
    if (alpha === 0) {
      return {
        fill: { type: 'none' },
        warnings,
      };
    }

    return {
      fill: {
        type: 'solid',
        color,
        alpha,
      },
      warnings,
    };
  }

  // No background specified
  return {
    fill: { type: 'none' },
    warnings,
  };
}

/**
 * Checks whether a CSS color value represents transparency.
 */
function isTransparent(value: string): boolean {
  if (!value) return true;

  const trimmed = value.trim().toLowerCase();
  return (
    trimmed === 'transparent' ||
    trimmed === 'none' ||
    trimmed === 'initial' ||
    trimmed === 'inherit' ||
    trimmed === '' ||
    trimmed === 'rgba(0, 0, 0, 0)' ||
    trimmed === 'rgba(0,0,0,0)'
  );
}
