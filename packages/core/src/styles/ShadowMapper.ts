/**
 * Maps CSS box-shadow to SlideForge ShadowStyle.
 * Tier B: spread value is recorded but ignored in PPTX output.
 */

import type { ShadowStyle, ConversionWarning } from '../types/styles';
import { normalizeColor, extractAlpha } from './CssParser';

export interface ShadowMapResult {
  shadow: ShadowStyle | null;
  warnings: ConversionWarning[];
}

/**
 * Maps CSS computed box-shadow to a ShadowStyle.
 * box-shadow syntax: [inset?] offsetX offsetY [blur [spread]] color
 *
 * @param computed - Record of CSS property names to their computed values
 * @returns The mapped shadow style (or null) and any conversion warnings
 */
export function mapShadow(
  computed: Record<string, string>
): ShadowMapResult {
  const warnings: ConversionWarning[] = [];
  const raw = computed['box-shadow'] ?? '';

  if (!raw || raw.trim().length === 0 || raw.trim().toLowerCase() === 'none') {
    return { shadow: null, warnings };
  }

  const trimmed = raw.trim();

  // Handle 'inset' shadows -- PPTX has limited inner shadow support
  if (trimmed.toLowerCase().startsWith('inset')) {
    warnings.push({
      code: 'SF-CSS-001',
      severity: 'medium',
      property: 'box-shadow',
      message:
        'Inset box-shadow approximated as outer shadow in PPTX; inset keyword ignored',
      original: raw,
    });
  }

  // Handle multiple shadows (comma-separated) -- only take the first
  const shadows = splitShadows(trimmed);
  if (shadows.length > 1) {
    warnings.push({
      code: 'SF-CSS-001',
      severity: 'low',
      property: 'box-shadow',
      message: `Multiple box-shadows detected (${String(shadows.length)}); only the first shadow is used in PPTX`,
      original: raw,
    });
  }

  const firstShadow = shadows[0];
  if (!firstShadow) {
    return { shadow: null, warnings };
  }

  const parsed = parseSingleShadow(firstShadow);

  if (!parsed) {
    warnings.push({
      code: 'SF-CSS-002',
      severity: 'medium',
      property: 'box-shadow',
      message: 'Unable to parse box-shadow value; shadow will be omitted',
      original: raw,
    });
    return { shadow: null, warnings };
  }

  // Warn about spread being ignored
  if (parsed.spread !== 0) {
    warnings.push({
      code: 'SF-CSS-001',
      severity: 'low',
      property: 'box-shadow',
      message: `box-shadow spread (${String(parsed.spread)}px) is not supported in PPTX and will be ignored`,
      original: raw,
    });
  }

  return {
    shadow: parsed,
    warnings,
  };
}

/**
 * Splits a box-shadow value by commas, respecting parentheses (for rgb/rgba).
 */
function splitShadows(value: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < value.length; i++) {
    const ch = value.charAt(i);
    if (ch === '(') {
      parenDepth++;
      current += ch;
    } else if (ch === ')') {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
    } else if (ch === ',' && parenDepth === 0) {
      if (current.trim().length > 0) {
        parts.push(current.trim());
      }
      current = '';
    } else {
      current += ch;
    }
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts;
}

/**
 * Parses a single box-shadow value into a ShadowStyle.
 *
 * Computed box-shadow format (from browsers):
 *   rgba(r, g, b, a) offsetX offsetY blur spread
 * or:
 *   offsetX offsetY blur spread color
 * or:
 *   offsetX offsetY blur color
 * or:
 *   offsetX offsetY color
 */
function parseSingleShadow(value: string): ShadowStyle | null {
  let working = value.trim();

  // Remove 'inset' keyword if present
  if (working.toLowerCase().startsWith('inset')) {
    working = working.substring(5).trim();
  }

  // Extract color part (may be at start or end)
  const extracted = extractColorFromShadow(working);

  // Parse numeric values from remaining
  const numbers = extractPxValues(extracted.remaining);

  if (numbers.length < 2) {
    return null;
  }

  const offsetX = numbers[0] ?? 0;
  const offsetY = numbers[1] ?? 0;
  const blur = numbers.length >= 3 ? Math.max(0, numbers[2] ?? 0) : 0;
  const spread = numbers.length >= 4 ? (numbers[3] ?? 0) : 0;

  return {
    offsetX,
    offsetY,
    blur,
    spread,
    color: extracted.color,
    alpha: extracted.alpha,
  };
}

/**
 * Extracts the color component from a shadow value string.
 * Returns the parsed color, alpha, and the remaining numeric tokens.
 */
function extractColorFromShadow(value: string): {
  color: string;
  alpha: number;
  remaining: string;
} {
  let remaining = value;

  // Check for rgba() or rgb() at the start
  const rgbaStartMatch = remaining.match(
    /^(rgba?\([^)]+\))\s*/
  );
  if (rgbaStartMatch) {
    const colorStr = rgbaStartMatch[1] ?? '';
    remaining = remaining.substring(rgbaStartMatch[0].length).trim();
    return {
      color: normalizeColor(colorStr),
      alpha: extractAlpha(colorStr),
      remaining,
    };
  }

  // Check for rgba() or rgb() at the end
  const rgbaEndMatch = remaining.match(
    /\s+(rgba?\([^)]+\))\s*$/
  );
  if (rgbaEndMatch) {
    const colorStr = rgbaEndMatch[1] ?? '';
    remaining = remaining.substring(0, remaining.length - rgbaEndMatch[0].length).trim();
    return {
      color: normalizeColor(colorStr),
      alpha: extractAlpha(colorStr),
      remaining,
    };
  }

  // Check for hex color at the start
  const hexStartMatch = remaining.match(
    /^(#[0-9a-fA-F]{3,8})\s+/
  );
  if (hexStartMatch) {
    const colorStr = hexStartMatch[1] ?? '';
    remaining = remaining.substring(hexStartMatch[0].length).trim();
    return {
      color: normalizeColor(colorStr),
      alpha: extractAlpha(colorStr),
      remaining,
    };
  }

  // Check for hex color at the end
  const hexEndMatch = remaining.match(
    /\s+(#[0-9a-fA-F]{3,8})\s*$/
  );
  if (hexEndMatch) {
    const colorStr = hexEndMatch[1] ?? '';
    remaining = remaining.substring(0, remaining.length - hexEndMatch[0].length).trim();
    return {
      color: normalizeColor(colorStr),
      alpha: extractAlpha(colorStr),
      remaining,
    };
  }

  // Check for named color at the end
  const words = remaining.split(/\s+/);
  if (words.length >= 3) {
    const lastWord = words[words.length - 1];
    if (lastWord && !/^-?[\d.]+/.test(lastWord)) {
      remaining = words.slice(0, -1).join(' ');
      return {
        color: normalizeColor(lastWord),
        alpha: 1,
        remaining,
      };
    }
  }

  // Default: black, fully opaque
  return {
    color: '000000',
    alpha: 1,
    remaining,
  };
}

/**
 * Extracts numeric pixel values from a string of space-separated tokens.
 */
function extractPxValues(value: string): number[] {
  const tokens = value.trim().split(/\s+/);
  const numbers: number[] = [];

  for (const token of tokens) {
    const cleaned = token.replace(/px$/i, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      numbers.push(num);
    }
  }

  return numbers;
}
