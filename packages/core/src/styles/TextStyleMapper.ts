/**
 * Maps CSS computed text styles to SlideForge TextStyle.
 * Handles font-size px-to-pt conversion, font-weight normalization,
 * and text decoration parsing.
 */

import type { TextStyle, ConversionWarning } from '../types/styles';
import { normalizeColor, extractAlpha } from './CssParser';
import { mapFont } from './FontMapper';

export interface TextStyleMapResult {
  textStyle: TextStyle;
  warnings: ConversionWarning[];
}

/**
 * Maps CSS computed styles to a TextStyle object.
 *
 * @param computed - Record of CSS property names to their computed values
 * @returns The mapped text style and any conversion warnings
 */
export function mapTextStyle(
  computed: Record<string, string>
): TextStyleMapResult {
  const warnings: ConversionWarning[] = [];

  // --- Color ---
  const rawColor = computed['color'] ?? '';
  const color = normalizeColor(rawColor);
  const alpha = extractAlpha(rawColor);

  // --- Font Size (px -> pt: divide by 1.333) ---
  const fontSize = parseFontSize(computed['font-size'] ?? '16px', warnings);

  // --- Font Family ---
  const fontResult = mapFont(computed['font-family'] ?? '');
  const fontFamily = fontResult.mapped;
  if (fontResult.substitution) {
    warnings.push({
      code: 'SF-ASSET-002',
      severity: 'low',
      property: 'font-family',
      message: `Font "${fontResult.substitution.original}" substituted with "${fontResult.substitution.replacement}"`,
      original: computed['font-family'],
    });
  }

  // --- Font Weight ---
  const fontWeight = parseFontWeight(computed['font-weight'] ?? 'normal');

  // --- Font Style ---
  const fontStyle = parseFontStyle(computed['font-style'] ?? 'normal');

  // --- Text Decoration ---
  const textDecoration = parseTextDecoration(
    computed['text-decoration'] ?? computed['text-decoration-line'] ?? 'none'
  );

  // --- Text Align ---
  const textAlign = parseTextAlign(computed['text-align'] ?? 'left');

  // --- Line Height ---
  const lineHeight = parseLineHeight(
    computed['line-height'] ?? 'normal',
    fontSize,
    warnings
  );

  // --- Letter Spacing ---
  const letterSpacing = parseLetterSpacing(
    computed['letter-spacing'] ?? 'normal',
    warnings
  );

  return {
    textStyle: {
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textDecoration,
      textAlign,
      lineHeight,
      letterSpacing,
      color,
      alpha,
    },
    warnings,
  };
}

/**
 * Parses CSS font-size to pixels.
 * Computed styles are typically in px, but we handle other units defensively.
 */
function parseFontSize(
  value: string,
  warnings: ConversionWarning[]
): number {
  const trimmed = value.trim().toLowerCase();

  // px value
  const pxMatch = trimmed.match(/^([\d.]+)\s*px$/);
  if (pxMatch) {
    return Math.max(1, parseFloat(pxMatch[1] ?? '16'));
  }

  // pt value (convert to px: pt * 1.333)
  const ptMatch = trimmed.match(/^([\d.]+)\s*pt$/);
  if (ptMatch) {
    return Math.max(1, parseFloat(ptMatch[1] ?? '12') * 1.333);
  }

  // em value (relative - assume 16px base)
  const emMatch = trimmed.match(/^([\d.]+)\s*em$/);
  if (emMatch) {
    warnings.push({
      code: 'SF-CSS-001',
      severity: 'low',
      property: 'font-size',
      message: 'Relative em unit converted assuming 16px base',
      original: value,
    });
    return Math.max(1, parseFloat(emMatch[1] ?? '1') * 16);
  }

  // rem value (relative - assume 16px base)
  const remMatch = trimmed.match(/^([\d.]+)\s*rem$/);
  if (remMatch) {
    warnings.push({
      code: 'SF-CSS-001',
      severity: 'low',
      property: 'font-size',
      message: 'Relative rem unit converted assuming 16px base',
      original: value,
    });
    return Math.max(1, parseFloat(remMatch[1] ?? '1') * 16);
  }

  // Numeric only (treat as px)
  const numOnly = parseFloat(trimmed);
  if (!isNaN(numOnly) && numOnly > 0) {
    return numOnly;
  }

  // Keyword sizes (approximate)
  const keywordSizes: Record<string, number> = {
    'xx-small': 9,
    'x-small': 10,
    'small': 13,
    'medium': 16,
    'large': 18,
    'x-large': 24,
    'xx-large': 32,
    'xxx-large': 48,
  };
  const keywordSize = keywordSizes[trimmed];
  if (keywordSize !== undefined) {
    return keywordSize;
  }

  // Fallback
  return 16;
}

/**
 * Parses CSS font-weight to 'normal' or 'bold'.
 * Numeric weights >= 700 are considered bold.
 */
function parseFontWeight(value: string): 'normal' | 'bold' {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === 'bold' || trimmed === 'bolder') {
    return 'bold';
  }

  const numeric = parseInt(trimmed, 10);
  if (!isNaN(numeric) && numeric >= 700) {
    return 'bold';
  }

  return 'normal';
}

/**
 * Parses CSS font-style to 'normal' or 'italic'.
 */
function parseFontStyle(value: string): 'normal' | 'italic' {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'italic' || trimmed === 'oblique') {
    return 'italic';
  }
  return 'normal';
}

/**
 * Parses CSS text-decoration to the appropriate type.
 */
function parseTextDecoration(
  value: string
): 'none' | 'underline' | 'line-through' {
  const trimmed = value.trim().toLowerCase();

  if (trimmed.includes('line-through')) {
    return 'line-through';
  }
  if (trimmed.includes('underline')) {
    return 'underline';
  }
  return 'none';
}

/**
 * Parses CSS text-align to the appropriate type.
 */
function parseTextAlign(
  value: string
): 'left' | 'center' | 'right' | 'justify' {
  const trimmed = value.trim().toLowerCase();

  switch (trimmed) {
    case 'center':
      return 'center';
    case 'right':
    case 'end':
      return 'right';
    case 'justify':
      return 'justify';
    case 'left':
    case 'start':
    default:
      return 'left';
  }
}

/**
 * Parses CSS line-height to a numeric ratio.
 * 'normal' defaults to 1.2, px/number values are converted to ratio.
 */
function parseLineHeight(
  value: string,
  fontSizePx: number,
  warnings: ConversionWarning[]
): number {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === 'normal' || trimmed === 'initial' || trimmed === 'inherit') {
    return 1.2;
  }

  // Unitless ratio (e.g., "1.5")
  const numericMatch = trimmed.match(/^([\d.]+)$/);
  if (numericMatch) {
    return Math.max(0.5, parseFloat(numericMatch[1] ?? '1.2'));
  }

  // px value (convert to ratio relative to font size)
  const pxMatch = trimmed.match(/^([\d.]+)\s*px$/);
  if (pxMatch && fontSizePx > 0) {
    return Math.max(0.5, parseFloat(pxMatch[1] ?? '0') / fontSizePx);
  }

  // percentage (convert to ratio)
  const percentMatch = trimmed.match(/^([\d.]+)\s*%$/);
  if (percentMatch) {
    return Math.max(0.5, parseFloat(percentMatch[1] ?? '120') / 100);
  }

  // em value
  const emMatch = trimmed.match(/^([\d.]+)\s*em$/);
  if (emMatch) {
    return Math.max(0.5, parseFloat(emMatch[1] ?? '1.2'));
  }

  warnings.push({
    code: 'SF-CSS-001',
    severity: 'low',
    property: 'line-height',
    message: `Unrecognized line-height value "${value}", using default 1.2`,
    original: value,
  });
  return 1.2;
}

/**
 * Parses CSS letter-spacing to pixels.
 * 'normal' defaults to 0.
 */
function parseLetterSpacing(
  value: string,
  warnings: ConversionWarning[]
): number {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === 'normal' || trimmed === 'initial' || trimmed === 'inherit') {
    return 0;
  }

  const pxMatch = trimmed.match(/^(-?[\d.]+)\s*px$/);
  if (pxMatch) {
    return parseFloat(pxMatch[1] ?? '0');
  }

  const emMatch = trimmed.match(/^(-?[\d.]+)\s*em$/);
  if (emMatch) {
    warnings.push({
      code: 'SF-CSS-001',
      severity: 'low',
      property: 'letter-spacing',
      message: 'Relative em unit converted assuming 16px base',
      original: value,
    });
    return parseFloat(emMatch[1] ?? '0') * 16;
  }

  const numOnly = parseFloat(trimmed);
  if (!isNaN(numOnly)) {
    return numOnly;
  }

  return 0;
}
