/**
 * ProgressEmitter — maps pipeline stage names to overall progress percentages
 * and emits progress updates via a callback.
 */

import type { ProgressInfo } from '../types';

export type ProgressCallback = (info: ProgressInfo) => void;

/**
 * Stage-to-progress range mapping.
 * Each stage occupies a portion of the 0–100 progress range.
 */
const STAGE_RANGES: Record<string, { start: number; end: number }> = {
  ingest: { start: 0, end: 5 },
  render: { start: 5, end: 20 },
  extract: { start: 20, end: 35 },
  analyze: { start: 35, end: 55 },
  build: { start: 55, end: 80 },
  package: { start: 80, end: 99 },
  report: { start: 100, end: 100 },
};

export class ProgressEmitter {
  constructor(private callback?: ProgressCallback) {}

  /**
   * Emit a progress update for a given stage.
   *
   * @param stage - The pipeline stage name (e.g. "ingest", "render")
   * @param progress - A 0–1 fractional progress within the stage
   * @param startTime - The pipeline start time (Date.now() value)
   */
  emit(stage: string, progress: number, startTime: number): void {
    if (!this.callback) {
      return;
    }

    const range = STAGE_RANGES[stage];
    const mappedProgress = range
      ? Math.round(range.start + (range.end - range.start) * Math.min(1, Math.max(0, progress)))
      : 0;

    this.callback({
      stage,
      progress: mappedProgress,
      elapsed: Date.now() - startTime,
    });
  }
}
