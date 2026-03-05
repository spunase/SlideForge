/**
 * EMU (English Metric Units) conversion utilities for OOXML/PPTX.
 *
 * 1 inch  = 914400 EMU
 * 1 pt    = 12700 EMU
 * 1 px    = 9525 EMU (at 96 DPI)
 */

/** Standard 16:9 slide dimensions in EMU (10" x 5.625") */
export const SLIDE_16_9 = { width: 12192000, height: 6858000 } as const;

/** Standard 4:3 slide dimensions in EMU (10" x 7.5") */
export const SLIDE_4_3 = { width: 9144000, height: 6858000 } as const;

/**
 * Convert CSS pixels to EMU.
 * 1 px = 9525 EMU at 96 DPI.
 */
export function pxToEmu(px: number): number {
  return Math.round(px * 9525);
}

/**
 * Convert typographic points to EMU.
 * 1 pt = 12700 EMU.
 */
export function ptToEmu(pt: number): number {
  return Math.round(pt * 12700);
}

/**
 * Convert typographic points to half-points (hundredths of a point).
 * OOXML font sizes are expressed in hundredths of a point (e.g. 1200 = 12pt).
 */
export function ptToHalfPt(pt: number): number {
  return Math.round(pt * 100);
}
