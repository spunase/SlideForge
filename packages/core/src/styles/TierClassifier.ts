/**
 * Classifies CSS properties into support tiers for PPTX conversion.
 *
 * Tier A: Full support, direct mapping to DrawingML.
 * Tier B: Approximate support, some fidelity loss.
 * Tier C: Unsupported, will be skipped with a warning.
 */

import type { SupportTier } from '../types/styles';

/**
 * Tier A properties: direct, lossless mapping to DrawingML.
 */
const TIER_A_PROPERTIES = new Set([
  'color',
  'font-size',
  'font-weight',
  'font-style',
  'font-family',
  'text-decoration',
  'text-decoration-line',
  'text-align',
  'line-height',
  'letter-spacing',
  'background-color',
  'border',
  'border-width',
  'border-color',
  'border-style',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'width',
  'height',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'z-index',
  'vertical-align',
  'white-space',
  'word-wrap',
  'overflow-wrap',
  'text-indent',
]);

/**
 * Tier B properties: approximate mapping with some fidelity loss.
 */
const TIER_B_PROPERTIES = new Set([
  'box-shadow',
  'text-shadow',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'opacity',
  'transform',
  'text-overflow',
  'word-spacing',
  'word-break',
  'overflow',
  'overflow-x',
  'overflow-y',
  'list-style',
  'list-style-type',
  'text-transform',
]);

/**
 * Tier C properties: unsupported in DrawingML, skipped with warning.
 */
const TIER_C_PROPERTIES = new Set([
  'filter',
  'mix-blend-mode',
  'backdrop-filter',
  'clip-path',
  'mask',
  'mask-image',
  'writing-mode',
  'columns',
  'column-count',
  'column-gap',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'perspective',
  'backface-visibility',
  'will-change',
  'contain',
  'content-visibility',
  'scroll-behavior',
  'scroll-snap-type',
  'scroll-snap-align',
  'pointer-events',
  'cursor',
  'user-select',
  'resize',
  'outline',
  'outline-width',
  'outline-color',
  'outline-style',
  'outline-offset',
]);

/**
 * Classifies a CSS property and value into a support tier.
 *
 * Some properties are conditionally classified based on their value.
 * For example, `background-image` with `linear-gradient` is Tier B,
 * but with `url()` it is handled separately.
 *
 * @param property - The CSS property name (lowercase)
 * @param value - The CSS property value
 * @returns The support tier classification
 */
export function classifyProperty(property: string, value: string): SupportTier {
  const prop = property.toLowerCase().trim();
  const val = value.toLowerCase().trim();

  // Check Tier A first
  if (TIER_A_PROPERTIES.has(prop)) {
    return 'A';
  }

  // Check Tier B
  if (TIER_B_PROPERTIES.has(prop)) {
    return 'B';
  }

  // Check Tier C
  if (TIER_C_PROPERTIES.has(prop)) {
    return 'C';
  }

  // Special cases for background-image
  if (prop === 'background-image' || prop === 'background') {
    if (val.includes('linear-gradient')) {
      return 'B';
    }
    if (val.includes('radial-gradient')) {
      return 'C';
    }
    if (val.includes('url(')) {
      return 'B';
    }
    return 'A';
  }

  // Transform sub-classification
  if (prop === 'transform') {
    if (val.includes('translate') || val.includes('scale')) {
      return 'B';
    }
    if (val.includes('rotate') || val.includes('skew') || val.includes('matrix')) {
      return 'C';
    }
    return 'B';
  }

  // Display property
  if (prop === 'display') {
    if (val === 'grid' || val === 'inline-grid') {
      return 'C';
    }
    if (val === 'flex' || val === 'inline-flex') {
      return 'B';
    }
    return 'A';
  }

  // Gap properties (grid/flex)
  if (prop === 'gap' || prop === 'row-gap' || prop === 'column-gap') {
    return 'B';
  }

  // Flex properties
  if (
    prop === 'flex' ||
    prop === 'flex-direction' ||
    prop === 'flex-wrap' ||
    prop === 'flex-grow' ||
    prop === 'flex-shrink' ||
    prop === 'flex-basis' ||
    prop === 'align-items' ||
    prop === 'align-self' ||
    prop === 'justify-content' ||
    prop === 'justify-self' ||
    prop === 'align-content' ||
    prop === 'order' ||
    prop === 'place-items' ||
    prop === 'place-content'
  ) {
    return 'B';
  }

  // Grid properties
  if (
    prop.startsWith('grid-') ||
    prop === 'grid'
  ) {
    return 'C';
  }

  // Unknown property defaults to Tier C
  return 'C';
}
