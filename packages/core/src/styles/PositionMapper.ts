/**
 * Maps and constrains element geometry to slide bounds.
 * Clips elements to slide boundaries and handles negative positions.
 */

import type { ElementGeometry } from '../types/styles';

/**
 * Maps an element's geometry to be within slide bounds.
 * Elements that extend beyond the slide are clipped.
 * Negative positions are handled by adjusting position and reducing dimensions.
 *
 * @param geometry - The original element geometry
 * @param slideWidth - The slide width in pixels
 * @param slideHeight - The slide height in pixels
 * @returns The constrained element geometry
 */
export function mapPosition(
  geometry: ElementGeometry,
  slideWidth: number,
  slideHeight: number
): ElementGeometry {
  let { x, y, width, height } = geometry;
  const { zIndex } = geometry;

  // Ensure non-negative dimensions
  width = Math.max(0, width);
  height = Math.max(0, height);

  // Handle negative X position: shift right and reduce width
  if (x < 0) {
    width = Math.max(0, width + x); // Reduce width by the overflow
    x = 0;
  }

  // Handle negative Y position: shift down and reduce height
  if (y < 0) {
    height = Math.max(0, height + y); // Reduce height by the overflow
    y = 0;
  }

  // Clip to right edge of slide
  if (x + width > slideWidth) {
    width = Math.max(0, slideWidth - x);
  }

  // Clip to bottom edge of slide
  if (y + height > slideHeight) {
    height = Math.max(0, slideHeight - y);
  }

  // If element is completely off-screen, place it at origin with zero size
  if (x >= slideWidth || y >= slideHeight) {
    x = 0;
    y = 0;
    width = 0;
    height = 0;
  }

  return {
    x,
    y,
    width,
    height,
    zIndex,
  };
}
