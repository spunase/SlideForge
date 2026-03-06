/**
 * SlideWorks diagnostic — dumps detailed shape/warning data for analysis.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from '../../convert';
import type { ConversionResult } from '../../types';

const FIXTURE_DIR = resolve(__dirname, '../../../../../tests/fixtures/slideworks');
const HTML_PATH = resolve(FIXTURE_DIR, 'index.html');
const CSS_PATH = resolve(FIXTURE_DIR, 'styles.css');
const OUTPUT_PATH = resolve(FIXTURE_DIR, 'diagnostic-output.json');

function loadFixture(): { html: string; assets: Map<string, Blob> } {
  const html = readFileSync(HTML_PATH, 'utf-8');
  const css = readFileSync(CSS_PATH, 'utf-8');
  const assets = new Map<string, Blob>();
  assets.set('index.html', new Blob([html], { type: 'text/html' }));
  assets.set('styles.css', new Blob([css], { type: 'text/css' }));
  return { html, assets };
}

describe('SlideWorks diagnostic dump', () => {
  let result: ConversionResult;

  beforeAll(async () => {
    const fixture = loadFixture();
    result = await convert(fixture.html, fixture.assets);
  }, 120_000);

  it('dumps diagnostic data to JSON', () => {
    const diagnostics = {
      report: {
        success: result.report.success,
        slideCount: result.report.slideCount,
        warnings: result.report.warnings,
        metrics: result.report.metrics,
        fontSubstitutions: result.report.fontSubstitutions,
      },
      slideShapeSummaries: result.mappedShapes.map((slide, i) => ({
        slideIndex: i,
        shapeCount: slide.length,
        shapes: slide.map((s) => ({
          textContent: s.textContent?.substring(0, 100) ?? null,
          fillType: s.fill.type,
          fillColor: s.fill.type === 'solid' ? s.fill.color : undefined,
          hasBorder: s.border?.width > 0,
          borderColor: s.border?.width > 0 ? s.border.color : undefined,
          hasShadow: s.shadow != null,
          x: Math.round(s.geometry.x),
          y: Math.round(s.geometry.y),
          w: Math.round(s.geometry.width),
          h: Math.round(s.geometry.height),
          fontSize: s.textStyle?.fontSize,
          fontFamily: s.textStyle?.fontFamily,
          fontWeight: s.textStyle?.fontWeight,
          textAlign: s.textStyle?.textAlign,
          color: s.textStyle?.color,
        })),
      })),
      blobSize: result.blob.size,
    };

    writeFileSync(OUTPUT_PATH, JSON.stringify(diagnostics, null, 2));
    console.log(`Diagnostic output written to ${OUTPUT_PATH}`);
    console.log(`PPTX blob size: ${(result.blob.size / 1024).toFixed(1)} KB`);

    // Summary stats
    const totalShapes = diagnostics.slideShapeSummaries.reduce((sum, s) => sum + s.shapeCount, 0);
    const fillTypes: Record<string, number> = {};
    const emptySlides: number[] = [];
    const noTextSlides: number[] = [];

    for (const slide of diagnostics.slideShapeSummaries) {
      if (slide.shapeCount === 0) emptySlides.push(slide.slideIndex);
      const hasText = slide.shapes.some((s) => s.textContent && s.textContent.trim().length > 0);
      if (!hasText) noTextSlides.push(slide.slideIndex);
      for (const s of slide.shapes) {
        fillTypes[s.fillType] = (fillTypes[s.fillType] || 0) + 1;
      }
    }

    console.log(`Total shapes: ${totalShapes}`);
    console.log(`Fill type distribution:`, fillTypes);
    console.log(`Empty slides (no shapes): ${emptySlides.length}`, emptySlides.slice(0, 10));
    console.log(`Slides without text: ${noTextSlides.length}`, noTextSlides.slice(0, 10));

    // Warnings summary
    const warnings = result.report.warnings ?? [];
    const bySeverity: Record<string, number> = {};
    for (const w of warnings) {
      bySeverity[w.severity] = (bySeverity[w.severity] || 0) + 1;
    }
    console.log(`Warnings by severity:`, bySeverity);
    console.log(`Warning codes:`, [...new Set(warnings.map((w) => w.code))]);

    expect(result.report.success).toBe(true);
  });
});
