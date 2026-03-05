/**
 * Maps CSS gradient values to SlideForge FillStyle.
 * Tier B: linear-gradient (approximation).
 * Tier C: radial-gradient (fallback to first color as solid).
 */

import type { FillStyle, GradientStop, ConversionWarning } from '../types/styles';
import { normalizeColor } from './CssParser';

export interface GradientMapResult {
  fill: FillStyle;
  warnings: ConversionWarning[];
}

/**
 * Maps a CSS background-image gradient value to a FillStyle.
 *
 * @param backgroundImage - The CSS background-image value (e.g., "linear-gradient(90deg, #ff0 0%, #f00 100%)")
 * @returns The mapped fill style and any conversion warnings
 */
export function mapGradient(backgroundImage: string): GradientMapResult {
  const warnings: ConversionWarning[] = [];

  if (!backgroundImage || backgroundImage.trim().length === 0) {
    return { fill: { type: 'none' }, warnings };
  }

  const trimmed = backgroundImage.trim().toLowerCase();

  // Handle radial-gradient (Tier C: fallback to first color)
  if (trimmed.includes('radial-gradient')) {
    return handleRadialGradient(backgroundImage, warnings);
  }

  // Handle conic-gradient (Tier C: fallback to first color)
  if (trimmed.includes('conic-gradient')) {
    warnings.push({
      code: 'SF-CSS-002',
      severity: 'high',
      property: 'background-image',
      message:
        'conic-gradient is not supported in PPTX; falling back to first color as solid fill',
      original: backgroundImage,
    });
    const firstColor = extractFirstColorFromGradient(backgroundImage);
    return {
      fill: {
        type: 'solid',
        color: firstColor,
        alpha: 1,
      },
      warnings,
    };
  }

  // Handle linear-gradient (Tier B)
  if (trimmed.includes('linear-gradient')) {
    return handleLinearGradient(backgroundImage, warnings);
  }

  // Unknown gradient type
  return { fill: { type: 'none' }, warnings };
}

/**
 * Handles linear-gradient parsing.
 * Syntax: linear-gradient([angle | direction,] color-stop, color-stop, ...)
 */
function handleLinearGradient(
  value: string,
  warnings: ConversionWarning[]
): GradientMapResult {
  warnings.push({
    code: 'SF-CSS-001',
    severity: 'low',
    property: 'background-image',
    message: 'linear-gradient is a Tier B approximation in PPTX',
    original: value,
  });

  // Extract content inside parentheses
  const content = extractParenContent(value, 'linear-gradient');
  if (!content) {
    return {
      fill: { type: 'none' },
      warnings,
    };
  }

  // Split by commas, respecting parentheses
  const parts = splitByComma(content);
  if (parts.length === 0) {
    return { fill: { type: 'none' }, warnings };
  }

  // First part may be angle or direction
  let angle = 180; // Default: top to bottom
  let colorStopStart = 0;

  const firstPart = parts[0];
  if (firstPart) {
    const firstPartLower = firstPart.trim().toLowerCase();

    // Check if first part is an angle
    const angleMatch = firstPartLower.match(/^(-?[\d.]+)\s*(deg|grad|rad|turn)?$/);
    if (angleMatch) {
      angle = parseAngle(angleMatch[1] ?? '180', angleMatch[2] ?? 'deg');
      colorStopStart = 1;
    } else if (firstPartLower.startsWith('to ')) {
      angle = directionToAngle(firstPartLower);
      colorStopStart = 1;
    }
  }

  // Parse color stops
  const stops: GradientStop[] = [];
  const colorParts = parts.slice(colorStopStart);

  for (let i = 0; i < colorParts.length; i++) {
    const colorPart = colorParts[i];
    if (colorPart) {
      const stop = parseColorStop(colorPart, i, colorParts.length);
      if (stop) {
        stops.push(stop);
      }
    }
  }

  // Need at least 2 stops for a gradient
  if (stops.length < 2) {
    if (stops.length === 1) {
      const singleStop = stops[0];
      if (singleStop) {
        return {
          fill: {
            type: 'solid',
            color: singleStop.color,
            alpha: 1,
          },
          warnings,
        };
      }
    }
    return { fill: { type: 'none' }, warnings };
  }

  return {
    fill: {
      type: 'gradient',
      gradientAngle: angle,
      gradientStops: stops,
    },
    warnings,
  };
}

/**
 * Handles radial-gradient (Tier C: fallback to first color).
 */
function handleRadialGradient(
  value: string,
  warnings: ConversionWarning[]
): GradientMapResult {
  warnings.push({
    code: 'SF-CSS-002',
    severity: 'high',
    property: 'background-image',
    message:
      'radial-gradient is not supported in PPTX; falling back to first color as solid fill',
    original: value,
  });

  const firstColor = extractFirstColorFromGradient(value);

  return {
    fill: {
      type: 'solid',
      color: firstColor,
      alpha: 1,
    },
    warnings,
  };
}

/**
 * Extracts the content inside parentheses for a given function name.
 */
function extractParenContent(value: string, funcName: string): string | null {
  const lower = value.toLowerCase();
  const funcIndex = lower.indexOf(funcName + '(');
  if (funcIndex === -1) {
    return null;
  }

  const startIndex = funcIndex + funcName.length + 1;
  let parenDepth = 1;
  let i = startIndex;

  while (i < value.length && parenDepth > 0) {
    if (value.charAt(i) === '(') {
      parenDepth++;
    } else if (value.charAt(i) === ')') {
      parenDepth--;
    }
    if (parenDepth > 0) {
      i++;
    }
  }

  return value.substring(startIndex, i);
}

/**
 * Splits a string by commas, respecting parentheses nesting.
 */
function splitByComma(value: string): string[] {
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
 * Converts a CSS angle value to degrees.
 */
function parseAngle(value: string, unit: string): number {
  const num = parseFloat(value);
  switch (unit) {
    case 'deg':
      return num;
    case 'grad':
      return num * 0.9;
    case 'rad':
      return num * (180 / Math.PI);
    case 'turn':
      return num * 360;
    default:
      return num;
  }
}

/**
 * Converts CSS gradient direction keywords to angle in degrees.
 */
function directionToAngle(direction: string): number {
  const trimmed = direction.trim().toLowerCase();

  const directionMap: Record<string, number> = {
    'to top': 0,
    'to top right': 45,
    'to right top': 45,
    'to right': 90,
    'to bottom right': 135,
    'to right bottom': 135,
    'to bottom': 180,
    'to bottom left': 225,
    'to left bottom': 225,
    'to left': 270,
    'to top left': 315,
    'to left top': 315,
  };

  return directionMap[trimmed] ?? 180;
}

/**
 * Parses a single color stop from a gradient.
 * Format: color [position%]
 */
function parseColorStop(
  value: string,
  index: number,
  total: number
): GradientStop | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // Try to extract position percentage
  const percentMatch = trimmed.match(/([\d.]+)\s*%\s*$/);
  let position: number;
  let colorPart: string;

  if (percentMatch) {
    const posStr = percentMatch[1] ?? '0';
    position = parseFloat(posStr);
    colorPart = trimmed.substring(0, trimmed.length - percentMatch[0].length).trim();
  } else {
    // Auto-calculate position based on index
    position = total <= 1 ? 0 : (index / (total - 1)) * 100;
    colorPart = trimmed;
  }

  if (colorPart.length === 0) {
    return null;
  }

  const color = normalizeColor(colorPart);

  return {
    position: Math.max(0, Math.min(100, position)),
    color,
  };
}

/**
 * Extracts the first color from a gradient value string.
 * Used as fallback for unsupported gradient types.
 */
function extractFirstColorFromGradient(value: string): string {
  // Find content inside parentheses
  const match = value.match(/gradient\(([^)]*(?:\([^)]*\))*[^)]*)\)/i);
  if (!match) {
    return '000000';
  }

  const content = match[1] ?? '';
  const parts = splitByComma(content);

  // Skip the first part if it looks like a direction/shape
  for (const part of parts) {
    const partLower = part.trim().toLowerCase();

    // Skip direction/shape definitions
    if (
      partLower.startsWith('to ') ||
      /^-?[\d.]+\s*(deg|grad|rad|turn)$/.test(partLower) ||
      partLower.includes('circle') ||
      partLower.includes('ellipse') ||
      partLower.includes('closest') ||
      partLower.includes('farthest')
    ) {
      continue;
    }

    // Extract color part (remove position)
    const colorPart = partLower.replace(/([\d.]+)\s*%\s*$/, '').trim();
    if (colorPart.length > 0) {
      return normalizeColor(colorPart);
    }
  }

  return '000000';
}
