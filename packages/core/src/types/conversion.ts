/**
 * Pipeline and report types for the HTML-to-PPTX conversion process.
 */

import type { ConversionWarning, ElementGeometry } from './styles';

export interface ConversionOptions {
  slideWidth: number;        // pixels (default 1920)
  slideHeight: number;       // pixels (default 1080)
}

export interface ConversionResult {
  blob: Blob;
  report: ConversionReport;
}

export interface ConversionReport {
  success: boolean;
  slideCount: number;
  warnings: ConversionWarning[];
  fontSubstitutions: Array<{ original: string; replacement: string }>;
  unsupportedRules: Array<{ property: string; value: string; tier: 'C' }>;
  metrics: ConversionMetrics;
}

export interface ConversionMetrics {
  timeIngestMs: number;
  timeRenderMs: number;
  timeAnalyzeMs: number;
  timePackageMs: number;
  timeTotalMs: number;
  peakMemoryMb: number;
  outputSizeMb: number;
}

export interface ProgressInfo {
  stage: string;
  progress: number;          // 0-100
  elapsed: number;           // ms
}

export interface ExtractedElement {
  tagName: string;
  textContent: string | null;
  geometry: ElementGeometry;
  computedStyles: Record<string, string>;
  children: ExtractedElement[];
  slideIndex: number;
  imageUrl?: string;
}
