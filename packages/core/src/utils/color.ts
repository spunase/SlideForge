/**
 * Color parsing and DrawingML color element generation.
 */

/** Map of CSS named colors to 6-digit hex (uppercase, no #). */
const NAMED_COLORS: Record<string, string> = {
  black: '000000',
  white: 'FFFFFF',
  red: 'FF0000',
  green: '008000',
  blue: '0000FF',
  transparent: '000000',
  yellow: 'FFFF00',
  cyan: '00FFFF',
  magenta: 'FF00FF',
  orange: 'FFA500',
  purple: '800080',
  pink: 'FFC0CB',
  gray: '808080',
  grey: '808080',
  lime: '00FF00',
  navy: '000080',
  teal: '008080',
  maroon: '800000',
  olive: '808000',
  silver: 'C0C0C0',
  aqua: '00FFFF',
  fuchsia: 'FF00FF',
};

/** Alpha value for fully transparent named color */
const TRANSPARENT_ALPHA = 0;

export interface ParsedColor {
  /** 6-digit uppercase hex string without '#' prefix (e.g. "FF00AA") */
  hex: string;
  /** Alpha from 0 (transparent) to 1 (opaque) */
  alpha: number;
}

/**
 * Clamp a number to [0, 255] and round.
 */
function clampByte(n: number): number {
  return Math.round(Math.min(255, Math.max(0, n)));
}

/**
 * Convert a single byte (0–255) to a 2-character uppercase hex string.
 */
function byteToHex(n: number): string {
  return clampByte(n).toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Expand a 3-char hex to 6-char hex: "F0A" → "FF00AA".
 */
function expandShortHex(short: string): string {
  return short
    .split('')
    .map((c) => c + c)
    .join('');
}

/**
 * Parse a CSS color string into a hex + alpha representation.
 *
 * Supports:
 * - Hex: #RGB, #RRGGBB, #RRGGBBAA
 * - rgb(r, g, b) and rgba(r, g, b, a)
 * - Named colors: black, white, red, green, blue, transparent, etc.
 *
 * @throws Error if the color string cannot be parsed.
 */
export function parseColor(css: string): ParsedColor {
  const trimmed = css.trim().toLowerCase();

  // Named colors
  const namedHex = NAMED_COLORS[trimmed];
  if (namedHex !== undefined) {
    return {
      hex: namedHex,
      alpha: trimmed === 'transparent' ? TRANSPARENT_ALPHA : 1,
    };
  }

  // Hex formats
  if (trimmed.startsWith('#')) {
    const raw = trimmed.slice(1).toUpperCase();

    if (raw.length === 3) {
      // #RGB
      return { hex: expandShortHex(raw), alpha: 1 };
    }
    if (raw.length === 4) {
      // #RGBA
      const expanded = expandShortHex(raw);
      const alphaValue = parseInt(expanded.slice(6, 8), 16) / 255;
      return { hex: expanded.slice(0, 6), alpha: alphaValue };
    }
    if (raw.length === 6) {
      // #RRGGBB
      return { hex: raw, alpha: 1 };
    }
    if (raw.length === 8) {
      // #RRGGBBAA
      const alphaValue = parseInt(raw.slice(6, 8), 16) / 255;
      return { hex: raw.slice(0, 6), alpha: alphaValue };
    }
  }

  // rgb() and rgba()
  const rgbaMatch = trimmed.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?)\s*)?\)$/,
  );
  if (rgbaMatch) {
    const rStr = rgbaMatch[1] ?? '0';
    const gStr = rgbaMatch[2] ?? '0';
    const bStr = rgbaMatch[3] ?? '0';
    const aStr = rgbaMatch[4];
    const r = clampByte(parseFloat(rStr));
    const g = clampByte(parseFloat(gStr));
    const b = clampByte(parseFloat(bStr));
    const a = aStr !== undefined ? Math.min(1, Math.max(0, parseFloat(aStr))) : 1;
    return {
      hex: byteToHex(r) + byteToHex(g) + byteToHex(b),
      alpha: a,
    };
  }

  // Modern rgb() with space syntax: rgb(255 0 128 / 0.5)
  const rgbSpaceMatch = trimmed.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?%?)\s*)?\)$/,
  );
  if (rgbSpaceMatch) {
    const rStr2 = rgbSpaceMatch[1] ?? '0';
    const gStr2 = rgbSpaceMatch[2] ?? '0';
    const bStr2 = rgbSpaceMatch[3] ?? '0';
    const r = clampByte(parseFloat(rStr2));
    const g = clampByte(parseFloat(gStr2));
    const b = clampByte(parseFloat(bStr2));
    let a = 1;
    const alphaGroup = rgbSpaceMatch[4];
    if (alphaGroup !== undefined) {
      const alphaStr = alphaGroup;
      a = alphaStr.endsWith('%')
        ? parseFloat(alphaStr) / 100
        : parseFloat(alphaStr);
      a = Math.min(1, Math.max(0, a));
    }
    return {
      hex: byteToHex(r) + byteToHex(g) + byteToHex(b),
      alpha: a,
    };
  }

  throw new Error(`Unable to parse color: "${css}"`);
}

/**
 * Generate a DrawingML `<a:srgbClr>` element string.
 *
 * @param hex - 6-digit uppercase hex color (e.g. "FF00AA")
 * @param alpha - Optional alpha from 0 to 1. If < 1, an `<a:alpha>` child is added.
 *                OOXML alpha is expressed as a percentage * 1000 (100000 = fully opaque).
 */
export function colorToSrgbClr(hex: string, alpha?: number): string {
  const val = hex.toUpperCase().replace(/^#/, '');

  if (alpha !== undefined && alpha < 1) {
    const ooxmlAlpha = Math.round(alpha * 100000);
    return `<a:srgbClr val="${val}"><a:alpha val="${ooxmlAlpha}"/></a:srgbClr>`;
  }

  return `<a:srgbClr val="${val}"/>`;
}
