/**
 * Public conversion API — the top-level entry point for SlideForge.
 *
 * Usage:
 * ```ts
 * import { convert } from '@slideforge/core';
 *
 * const result = await convert(htmlString, assets, { slideWidth: 1920, slideHeight: 1080 });
 * ```
 */

import type {
  ConversionOptions,
  ConversionResult,
  ProgressInfo,
} from './types';
import { Pipeline } from './pipeline';

/** Default conversion options: 1920x1080 (Full HD, 16:9) */
const DEFAULT_OPTIONS: ConversionOptions = {
  slideWidth: 1920,
  slideHeight: 1080,
};

/**
 * Convert HTML content into a PowerPoint (PPTX) file.
 *
 * @param html - The HTML string to convert
 * @param assets - Map of asset URLs to their Blob data
 * @param options - Partial conversion options (merged with defaults)
 * @param onProgress - Optional callback for progress updates
 * @param signal - Optional AbortSignal for cancellation
 * @returns A ConversionResult with the PPTX blob and conversion report
 */
export async function convert(
  html: string,
  assets: Map<string, Blob>,
  options?: Partial<ConversionOptions>,
  onProgress?: (info: ProgressInfo) => void,
  signal?: AbortSignal,
): Promise<ConversionResult> {
  const mergedOptions: ConversionOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const pipeline = new Pipeline();
  return pipeline.run(html, assets, mergedOptions, onProgress, signal);
}
