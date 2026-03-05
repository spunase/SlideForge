/**
 * Report stage — aggregates all warnings, metrics, and substitutions
 * into a final ConversionReport.
 */

import type { ConversionReport, ConversionWarning } from '../../types';

export interface ReportInput {
  slideCount: number;
  warnings: ConversionWarning[];
  fontSubstitutions: Array<{ original: string; replacement: string }>;
  timings: {
    ingestMs: number;
    renderMs: number;
    analyzeMs: number;
    packageMs: number;
    totalMs: number;
  };
  outputSizeMb: number;
}

/**
 * Build the final conversion report from aggregated pipeline data.
 *
 * @param input - All data collected across pipeline stages
 * @returns A complete ConversionReport
 */
export function buildReport(input: ReportInput): ConversionReport {
  // Collect Tier C unsupported rules from warnings
  const unsupportedRules: Array<{ property: string; value: string; tier: 'C' }> = [];
  for (const warning of input.warnings) {
    if (warning.code === 'SF-CSS-002' && warning.original !== undefined) {
      unsupportedRules.push({
        property: warning.property,
        value: warning.original,
        tier: 'C',
      });
    }
  }

  return {
    success: true,
    slideCount: input.slideCount,
    warnings: input.warnings,
    fontSubstitutions: input.fontSubstitutions,
    unsupportedRules,
    metrics: {
      timeIngestMs: input.timings.ingestMs,
      timeRenderMs: input.timings.renderMs,
      timeAnalyzeMs: input.timings.analyzeMs,
      timePackageMs: input.timings.packageMs,
      timeTotalMs: input.timings.totalMs,
      peakMemoryMb: 0, // Not easily measurable in all environments
      outputSizeMb: input.outputSizeMb,
    },
  };
}
