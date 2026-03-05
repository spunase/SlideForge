/**
 * SlideForge Core — HTML-to-PPTX conversion engine.
 *
 * @packageDocumentation
 */

export { convert } from './convert';

export type {
  ConversionOptions,
  ConversionResult,
  ConversionReport,
  ConversionMetrics,
  ProgressInfo,
} from './types';

export type { SlideShape, TextRun } from './builders';

export { assemblePptx } from './assembler';
