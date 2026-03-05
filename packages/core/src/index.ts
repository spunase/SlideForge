/**
 * SlideForge Core — HTML-to-PPTX conversion engine.
 *
 * @packageDocumentation
 */

export { convert } from './convert';
export { runSelfCheckWithAutoFix } from './selfCheck';
export { inlineCssIntoHtml } from './pipeline/stages/render';

export type {
  ConversionOptions,
  ConversionResult,
  ConversionReport,
  ConversionMetrics,
  ProgressInfo,
  MappedShape,
  FillStyle,
  BorderStyle,
  ShadowStyle,
  TextStyle,
  ElementGeometry,
  SelfCheckExpectations,
  SelfCheckFixStrategy,
  SelfCheckFix,
  SelfCheckIssue,
  SelfCheckResult,
} from './types';

export type { SlideShape, TextRun } from './builders';

export { assemblePptx } from './assembler';
