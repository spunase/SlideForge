/**
 * Pipeline — orchestrates the 7-stage HTML-to-PPTX conversion process.
 *
 * Stages: ingest → render → extract → analyze → build → package → report
 *
 * Each stage is separated by cancellation checks and progress emissions.
 */

import type { ConversionOptions, ConversionResult, ConversionWarning } from '../types';
import { pxToEmu } from '../utils/emu';
import { ProgressEmitter, type ProgressCallback } from './ProgressEmitter';
import { CancellationToken } from './CancellationToken';
import { ingest } from './stages/ingest';
import { render } from './stages/render';
import { extract } from './stages/extract';
import { analyze } from './stages/analyze';
import { build } from './stages/build';
import { packageSlides } from './stages/package';
import { buildReport } from './stages/report';

export class Pipeline {
  /**
   * Run the full conversion pipeline.
   *
   * @param html - The HTML input string
   * @param _assets - Map of asset URLs to Blob data (reserved for Phase 2)
   * @param options - Slide dimensions and conversion options
   * @param onProgress - Optional progress callback
   * @param signal - Optional AbortSignal for cancellation
   * @returns The conversion result with blob and report
   */
  async run(
    html: string,
    _assets: Map<string, Blob>,
    options: ConversionOptions,
    onProgress?: ProgressCallback,
    signal?: AbortSignal,
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const progress = new ProgressEmitter(onProgress);
    const token = new CancellationToken(signal);
    const allWarnings: ConversionWarning[] = [];

    try {
      // ── Stage 1: Ingest ──────────────────────────────────────────────
      progress.emit('ingest', 0, startTime);
      const ingestStart = Date.now();
      const ingestResult = ingest(html);
      allWarnings.push(...ingestResult.warnings);
      const ingestMs = Date.now() - ingestStart;
      progress.emit('ingest', 1, startTime);

      token.throwIfCancelled();

      // ── Stage 2: Render ──────────────────────────────────────────────
      progress.emit('render', 0, startTime);
      const renderStart = Date.now();
      const renderResult = render(ingestResult.segments);
      const renderMs = Date.now() - renderStart;
      progress.emit('render', 1, startTime);

      token.throwIfCancelled();

      // ── Stage 3: Extract ─────────────────────────────────────────────
      progress.emit('extract', 0, startTime);
      const extractStart = Date.now();
      const extractResult = extract(renderResult.documents, options.slideWidth);
      const extractMs = Date.now() - extractStart;
      progress.emit('extract', 1, startTime);

      token.throwIfCancelled();

      // ── Stage 4: Analyze ─────────────────────────────────────────────
      progress.emit('analyze', 0, startTime);
      const analyzeStart = Date.now();
      const analyzeResult = analyze(
        extractResult.slides,
        options.slideWidth,
        options.slideHeight,
      );
      allWarnings.push(...analyzeResult.warnings);
      const analyzeMs = Date.now() - analyzeStart;
      progress.emit('analyze', 1, startTime);

      token.throwIfCancelled();

      // ── Stage 5: Build ───────────────────────────────────────────────
      progress.emit('build', 0, startTime);
      const buildStart = Date.now();
      const buildResult = build(analyzeResult.slides);
      const buildMs = Date.now() - buildStart;
      progress.emit('build', 1, startTime);

      token.throwIfCancelled();

      // ── Stage 6: Package ─────────────────────────────────────────────
      progress.emit('package', 0, startTime);
      const packageStart = Date.now();
      const widthEmu = pxToEmu(options.slideWidth);
      const heightEmu = pxToEmu(options.slideHeight);
      const packageResult = await packageSlides(buildResult.slides, widthEmu, heightEmu);
      const packageMs = Date.now() - packageStart;
      progress.emit('package', 1, startTime);

      // ── Stage 7: Report ──────────────────────────────────────────────
      const totalMs = Date.now() - startTime;
      const report = buildReport({
        slideCount: ingestResult.segments.length,
        warnings: allWarnings,
        fontSubstitutions: buildResult.fontSubstitutions,
        timings: {
          ingestMs,
          renderMs: renderMs + extractMs, // Combine render + extract into render timing
          analyzeMs: analyzeMs + buildMs,  // Combine analyze + build into analyze timing
          packageMs,
          totalMs,
        },
        outputSizeMb: packageResult.outputSizeMb,
      });

      progress.emit('report', 1, startTime);

      return {
        blob: packageResult.blob,
        report,
      };
    } catch (error: unknown) {
      // Build an error report instead of crashing
      const totalMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown conversion error';
      const errorCode =
        error instanceof Error && error.name.startsWith('SF-')
          ? error.name
          : 'SF-PIPELINE-001';

      allWarnings.push({
        code: errorCode,
        severity: 'critical',
        property: 'pipeline',
        message: errorMessage,
      });

      const report = buildReport({
        slideCount: 0,
        warnings: allWarnings,
        fontSubstitutions: [],
        timings: {
          ingestMs: 0,
          renderMs: 0,
          analyzeMs: 0,
          packageMs: 0,
          totalMs,
        },
        outputSizeMb: 0,
      });

      // Mark as unsuccessful
      report.success = false;

      return {
        blob: new Blob([]),
        report,
      };
    }
  }
}
