/**
 * Maps CSS border properties to SlideForge BorderStyle.
 * border-radius is Tier B (approximation warning).
 */

import type { BorderStyle, ConversionWarning } from '../types/styles';
import { normalizeColor } from './CssParser';

export interface BorderMapResult {
  border: BorderStyle;
  warnings: ConversionWarning[];
}

/**
 * Maps CSS computed border properties to a BorderStyle.
 *
 * @param computed - Record of CSS property names to their computed values
 * @returns The mapped border style and any conversion warnings
 */
export function mapBorder(
  computed: Record<string, string>
): BorderMapResult {
  const warnings: ConversionWarning[] = [];

  // --- Border Width ---
  const width = parseBorderWidth(computed);

  // --- Border Color ---
  const rawColor =
    computed['border-color'] ??
    computed['border-top-color'] ??
    '';
  const color = rawColor ? normalizeColor(rawColor) : '000000';

  // --- Border Style ---
  const style = parseBorderStyle(computed);

  // --- Border Radius (Tier B) ---
  const radius = parseBorderRadius(computed, warnings);

  // If width is 0 or style is none, return a none border
  if (width === 0 || style === 'none') {
    return {
      border: {
        width: 0,
        color: '000000',
        style: 'none',
        radius,
      },
      warnings,
    };
  }

  return {
    border: {
      width,
      color,
      style,
      radius,
    },
    warnings,
  };
}

/**
 * Parses the border-width from computed styles.
 * Checks shorthand and side-specific properties.
 */
function parseBorderWidth(computed: Record<string, string>): number {
  const raw =
    computed['border-width'] ??
    computed['border-top-width'] ??
    '';

  return parsePxValue(raw, 0);
}

/**
 * Parses border-style from computed styles.
 */
function parseBorderStyle(
  computed: Record<string, string>
): 'solid' | 'dashed' | 'dotted' | 'none' {
  const raw =
    computed['border-style'] ??
    computed['border-top-style'] ??
    '';
  const trimmed = raw.trim().toLowerCase();

  switch (trimmed) {
    case 'solid':
      return 'solid';
    case 'dashed':
      return 'dashed';
    case 'dotted':
      return 'dotted';
    case 'double':
    case 'groove':
    case 'ridge':
    case 'inset':
    case 'outset':
      // These exist in CSS but not in simple PPTX lines; approximate as solid
      return 'solid';
    case 'none':
    case 'hidden':
    default:
      return 'none';
  }
}

/**
 * Parses border-radius from computed styles.
 * PPTX only supports uniform corner rounding, so we take the first value.
 * This is a Tier B approximation.
 */
function parseBorderRadius(
  computed: Record<string, string>,
  warnings: ConversionWarning[]
): number | undefined {
  const raw =
    computed['border-radius'] ??
    computed['border-top-left-radius'] ??
    '';

  if (!raw || raw.trim() === '0' || raw.trim() === '0px' || raw.trim() === '') {
    return undefined;
  }

  const radius = parsePxValue(raw, 0);

  if (radius > 0) {
    // Check if all corners are the same (shorthand may have multiple values)
    const parts = raw
      .trim()
      .split(/\s+/)
      .filter((p) => p.length > 0);

    if (parts.length > 1) {
      warnings.push({
        code: 'SF-CSS-001',
        severity: 'low',
        property: 'border-radius',
        message:
          'Non-uniform border-radius approximated using first value; PPTX supports only uniform rounding',
        original: raw,
      });
    } else {
      warnings.push({
        code: 'SF-CSS-001',
        severity: 'low',
        property: 'border-radius',
        message:
          'border-radius is a Tier B approximation in PPTX',
        original: raw,
      });
    }

    return radius;
  }

  return undefined;
}

/**
 * Parses a CSS value that may contain "px" suffix to a number.
 * Returns the fallback value if parsing fails.
 */
function parsePxValue(value: string, fallback: number): number {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === 'none' || trimmed === 'initial' || trimmed === 'inherit') {
    return fallback;
  }

  // Try keyword border widths
  const keywords: Record<string, number> = {
    thin: 1,
    medium: 3,
    thick: 5,
  };
  const keywordValue = keywords[trimmed];
  if (keywordValue !== undefined) {
    return keywordValue;
  }

  // Extract first numeric value with optional px/pt suffix
  const match = trimmed.match(/^(-?[\d.]+)\s*(px|pt|em|rem|%)?/);
  if (match) {
    const numStr = match[1] ?? '0';
    const num = parseFloat(numStr);
    if (!isNaN(num)) {
      const unit = match[2] ?? 'px';
      if (unit === 'pt') {
        return num * 1.333;
      }
      if (unit === 'em' || unit === 'rem') {
        return num * 16;
      }
      return num;
    }
  }

  return fallback;
}
