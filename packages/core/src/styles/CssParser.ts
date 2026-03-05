/**
 * CSS parsing utilities for inline styles and color normalization.
 */

/**
 * Named CSS colors mapped to their 6-digit hex equivalents (lowercase).
 * This is a subset covering the most commonly used named colors.
 */
const NAMED_COLORS: Record<string, string> = {
  black: '000000',
  white: 'ffffff',
  red: 'ff0000',
  green: '008000',
  blue: '0000ff',
  yellow: 'ffff00',
  cyan: '00ffff',
  magenta: 'ff00ff',
  orange: 'ffa500',
  purple: '800080',
  pink: 'ffc0cb',
  gray: '808080',
  grey: '808080',
  silver: 'c0c0c0',
  navy: '000080',
  teal: '008080',
  maroon: '800000',
  olive: '808000',
  lime: '00ff00',
  aqua: '00ffff',
  fuchsia: 'ff00ff',
  coral: 'ff7f50',
  salmon: 'fa8072',
  tomato: 'ff6347',
  gold: 'ffd700',
  indigo: '4b0082',
  violet: 'ee82ee',
  crimson: 'dc143c',
  chocolate: 'd2691e',
  darkgray: 'a9a9a9',
  darkgrey: 'a9a9a9',
  darkblue: '00008b',
  darkgreen: '006400',
  darkred: '8b0000',
  lightgray: 'd3d3d3',
  lightgrey: 'd3d3d3',
  lightblue: 'add8e6',
  lightgreen: '90ee90',
  whitesmoke: 'f5f5f5',
  aliceblue: 'f0f8ff',
  ghostwhite: 'f8f8ff',
  ivory: 'fffff0',
  snow: 'fffafa',
  linen: 'faf0e6',
  beige: 'f5f5dc',
  khaki: 'f0e68c',
  transparent: '000000',
};

/**
 * Parses an inline style string into a key-value record.
 * Handles edge cases like empty strings, trailing semicolons,
 * and values containing colons (e.g., url()).
 */
export function parseInlineStyle(style: string): Record<string, string> {
  const result: Record<string, string> = {};

  if (!style || style.trim().length === 0) {
    return result;
  }

  // Split on semicolons but not those inside parentheses (e.g., rgb(), url())
  const declarations = splitDeclarations(style);

  for (const declaration of declarations) {
    const trimmed = declaration.trim();
    if (trimmed.length === 0) {
      continue;
    }

    // Find the first colon that separates property from value
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const property = trimmed.substring(0, colonIndex).trim().toLowerCase();
    const value = trimmed.substring(colonIndex + 1).trim();

    if (property.length > 0 && value.length > 0) {
      // Remove !important if present
      const cleanValue = value.replace(/\s*!important\s*$/i, '').trim();
      if (cleanValue.length > 0) {
        result[property] = cleanValue;
      }
    }
  }

  return result;
}

/**
 * Splits a CSS style string by semicolons, respecting parentheses nesting.
 * This ensures values like `rgb(0, 0, 0)` or `url(data:...)` are not split.
 */
function splitDeclarations(style: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < style.length; i++) {
    const ch = style.charAt(i);
    if (ch === '(') {
      parenDepth++;
      current += ch;
    } else if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
    } else if (ch === ';' && parenDepth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim().length > 0) {
    parts.push(current);
  }

  return parts;
}

/**
 * Normalizes a CSS color value to a 6-digit uppercase hex string (RRGGBB).
 * Handles: named colors, #RGB, #RRGGBB, rgb(), rgba().
 * Returns '000000' for unrecognized values.
 */
export function normalizeColor(value: string): string {
  if (!value || value.trim().length === 0) {
    return '000000';
  }

  const trimmed = value.trim().toLowerCase();

  // Handle 'none', 'initial', 'inherit', 'unset', 'currentcolor'
  if (
    trimmed === 'none' ||
    trimmed === 'initial' ||
    trimmed === 'inherit' ||
    trimmed === 'unset' ||
    trimmed === 'currentcolor'
  ) {
    return '000000';
  }

  // Handle 'transparent'
  if (trimmed === 'transparent') {
    return '000000';
  }

  // Named colors
  const namedColor = NAMED_COLORS[trimmed];
  if (namedColor !== undefined) {
    return namedColor.toUpperCase();
  }

  // Hex: #RGB or #RRGGBB or #RRGGBBAA
  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }

  // rgb() or rgba()
  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)/
  );
  if (rgbMatch) {
    const rStr = rgbMatch[1] ?? '0';
    const gStr = rgbMatch[2] ?? '0';
    const bStr = rgbMatch[3] ?? '0';
    const r = clampByte(parseInt(rStr, 10));
    const g = clampByte(parseInt(gStr, 10));
    const b = clampByte(parseInt(bStr, 10));
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // rgb() with percentage values
  const rgbPercentMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%/
  );
  if (rgbPercentMatch) {
    const rStr = rgbPercentMatch[1] ?? '0';
    const gStr = rgbPercentMatch[2] ?? '0';
    const bStr = rgbPercentMatch[3] ?? '0';
    const r = clampByte(Math.round((parseFloat(rStr) / 100) * 255));
    const g = clampByte(Math.round((parseFloat(gStr) / 100) * 255));
    const b = clampByte(Math.round((parseFloat(bStr) / 100) * 255));
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  return '000000';
}

/**
 * Extracts the alpha component from a CSS color value.
 * Returns 1 for fully opaque, 0 for transparent.
 */
export function extractAlpha(value: string): number {
  if (!value || value.trim().length === 0) {
    return 1;
  }

  const trimmed = value.trim().toLowerCase();

  if (trimmed === 'transparent') {
    return 0;
  }

  // rgba(r, g, b, a) or rgba(r g b / a)
  const rgbaMatch = trimmed.match(
    /^rgba\(\s*[\d.]+%?\s*[,\s]\s*[\d.]+%?\s*[,\s]\s*[\d.]+%?\s*[,/]\s*([\d.]+)\s*\)/
  );
  if (rgbaMatch) {
    const alphaStr = rgbaMatch[1] ?? '1';
    return Math.max(0, Math.min(1, parseFloat(alphaStr)));
  }

  // #RRGGBBAA
  if (trimmed.startsWith('#') && trimmed.length === 9) {
    const alphaHex = trimmed.substring(7, 9);
    return Math.round((parseInt(alphaHex, 16) / 255) * 100) / 100;
  }

  return 1;
}

function parseHexColor(hex: string): string {
  const cleaned = hex.replace('#', '');

  if (cleaned.length === 3) {
    // #RGB -> #RRGGBB
    const r = cleaned.charAt(0);
    const g = cleaned.charAt(1);
    const b = cleaned.charAt(2);
    return (r + r + g + g + b + b).toUpperCase();
  }

  if (cleaned.length === 4) {
    // #RGBA -> #RRGGBB (ignore alpha for color)
    const r = cleaned.charAt(0);
    const g = cleaned.charAt(1);
    const b = cleaned.charAt(2);
    return (r + r + g + g + b + b).toUpperCase();
  }

  if (cleaned.length === 6) {
    return cleaned.toUpperCase();
  }

  if (cleaned.length === 8) {
    // #RRGGBBAA -> #RRGGBB (ignore alpha for color)
    return cleaned.substring(0, 6).toUpperCase();
  }

  return '000000';
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function componentToHex(value: number): string {
  const hex = value.toString(16);
  return hex.length === 1 ? '0' + hex : hex.toUpperCase();
}
