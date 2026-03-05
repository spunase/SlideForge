/**
 * Font family mapper with fallback table for PPTX-safe fonts.
 * Maps web fonts to their closest PowerPoint-compatible equivalents.
 */

const FONT_FALLBACK: Record<string, string> = {
  'Inter': 'Arial',
  'Roboto': 'Calibri',
  'Helvetica': 'Arial',
  'Helvetica Neue': 'Arial',
  'Georgia': 'Times New Roman',
  'Fira Code': 'Consolas',
  'Source Code Pro': 'Consolas',
  'monospace': 'Consolas',
  'sans-serif': 'Arial',
  'serif': 'Times New Roman',
  'cursive': 'Comic Sans MS',
  'fantasy': 'Impact',
  'system-ui': 'Segoe UI',
  '-apple-system': 'Segoe UI',
  'BlinkMacSystemFont': 'Segoe UI',
  'Segoe UI': 'Segoe UI',
  'Arial': 'Arial',
  'Calibri': 'Calibri',
  'Times New Roman': 'Times New Roman',
  'Consolas': 'Consolas',
  'Courier New': 'Courier New',
  'Verdana': 'Verdana',
  'Tahoma': 'Tahoma',
  'Trebuchet MS': 'Trebuchet MS',
  'Lucida Console': 'Lucida Console',
  'Palatino Linotype': 'Palatino Linotype',
  'Book Antiqua': 'Book Antiqua',
  'Century Gothic': 'Century Gothic',
  'Garamond': 'Garamond',
  'Impact': 'Impact',
  'Comic Sans MS': 'Comic Sans MS',
};

/**
 * Known PPTX-safe fonts that don't require substitution.
 */
const PPTX_SAFE_FONTS = new Set([
  'Arial',
  'Calibri',
  'Times New Roman',
  'Consolas',
  'Courier New',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Segoe UI',
  'Lucida Console',
  'Palatino Linotype',
  'Book Antiqua',
  'Century Gothic',
  'Garamond',
  'Impact',
  'Comic Sans MS',
  'Cambria',
  'Candara',
  'Constantia',
  'Corbel',
]);

export interface FontMapResult {
  mapped: string;
  substitution: { original: string; replacement: string } | null;
}

/**
 * Maps a CSS font-family value to a PPTX-safe font.
 * Parses comma-separated font stacks and returns the first match.
 *
 * @param fontFamily - The CSS font-family value (may be comma-separated)
 * @returns The mapped font and any substitution info
 */
export function mapFont(fontFamily: string): FontMapResult {
  if (!fontFamily || fontFamily.trim().length === 0) {
    return { mapped: 'Arial', substitution: { original: '', replacement: 'Arial' } };
  }

  // Parse the font stack: split by commas and clean up quotes
  const fonts = fontFamily
    .split(',')
    .map((f) => f.trim().replace(/^["']|["']$/g, '').trim())
    .filter((f) => f.length > 0);

  // Try each font in the stack
  for (const font of fonts) {
    // Check if it's already a PPTX-safe font
    if (PPTX_SAFE_FONTS.has(font)) {
      return { mapped: font, substitution: null };
    }

    // Check the fallback table
    const fallback = FONT_FALLBACK[font];
    if (fallback !== undefined) {
      // If the fallback is the same as the original, no substitution needed
      if (fallback === font) {
        return { mapped: font, substitution: null };
      }
      return {
        mapped: fallback,
        substitution: { original: font, replacement: fallback },
      };
    }
  }

  // No match found in the stack; try generic fallbacks from the stack
  for (const font of fonts) {
    const lower = font.toLowerCase();
    if (lower === 'sans-serif' || lower === 'sans') {
      return {
        mapped: 'Arial',
        substitution: { original: fontFamily, replacement: 'Arial' },
      };
    }
    if (lower === 'serif') {
      return {
        mapped: 'Times New Roman',
        substitution: { original: fontFamily, replacement: 'Times New Roman' },
      };
    }
    if (lower === 'monospace' || lower === 'mono') {
      return {
        mapped: 'Consolas',
        substitution: { original: fontFamily, replacement: 'Consolas' },
      };
    }
  }

  // Ultimate fallback to Arial
  const original = fonts[0] || fontFamily;
  return {
    mapped: 'Arial',
    substitution: { original, replacement: 'Arial' },
  };
}
