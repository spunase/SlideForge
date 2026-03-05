/**
 * Package stage — assembles SlideData into a PPTX zip blob.
 */

import type { SlideData } from '../../assembler';
import { assemblePptx } from '../../assembler';

export interface PackageResult {
  blob: Blob;
  outputSizeMb: number;
}

/**
 * Package the built slides into a PPTX file.
 *
 * @param slides - Array of SlideData (shapes + images)
 * @param widthEmu - Slide width in EMU
 * @param heightEmu - Slide height in EMU
 * @returns The PPTX blob and its size in MB
 */
export async function packageSlides(
  slides: SlideData[],
  widthEmu: number,
  heightEmu: number,
): Promise<PackageResult> {
  const blob = await assemblePptx(slides, widthEmu, heightEmu);
  const outputSizeMb = blob.size / (1024 * 1024);

  return { blob, outputSizeMb };
}
