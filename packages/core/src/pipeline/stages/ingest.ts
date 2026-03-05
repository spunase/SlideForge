/**
 * Ingest stage — validates HTML input and segments it into slides.
 */

import type { ConversionWarning } from '../../types';
import { segmentSlides } from '../../segmentation';

export interface IngestResult {
  segments: string[];
  warnings: ConversionWarning[];
}

/**
 * Validate and segment the input HTML into individual slide fragments.
 *
 * @param html - The raw HTML input
 * @returns Segmented slide HTML strings and any warnings
 * @throws Error with code SF-INPUT-002 if HTML is empty or invalid
 */
export function ingest(html: string): IngestResult {
  if (!html || html.trim().length === 0) {
    const error = new Error('Input HTML is empty or invalid');
    error.name = 'SF-INPUT-002';
    throw error;
  }

  const { segments, warnings } = segmentSlides(html);

  if (segments.length === 0) {
    const error = new Error('No slide content could be extracted from the HTML');
    error.name = 'SF-INPUT-002';
    throw error;
  }

  return { segments, warnings };
}
