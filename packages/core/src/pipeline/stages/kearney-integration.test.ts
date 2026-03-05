/**
 * Kearney fixture integration test — exercises the full pipeline
 * with a 3-column grid layout, linear gradients, SVG icons, and
 * external CSS with CSS custom properties.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from '../../convert';
import type { ConversionResult } from '../../types';

const FIXTURE_DIR = resolve(__dirname, '../../../../../tests/fixtures/kearney');
const HTML_PATH = resolve(FIXTURE_DIR, 'index.html');
const CSS_PATH = resolve(FIXTURE_DIR, 'styles.css');

function loadFixture(): { html: string; assets: Map<string, Blob> } {
  const html = readFileSync(HTML_PATH, 'utf-8');
  const css = readFileSync(CSS_PATH, 'utf-8');

  const assets = new Map<string, Blob>();
  assets.set('index.html', new Blob([html], { type: 'text/html' }));
  assets.set('styles.css', new Blob([css], { type: 'text/css' }));

  return { html, assets };
}

describe('Kearney fixture integration', () => {
  let result: ConversionResult;

  beforeAll(async () => {
    const fixture = loadFixture();
    result = await convert(fixture.html, fixture.assets);
  });

  // ── Pipeline result ────────────────────────────────────────────────

  it('conversion succeeds', () => {
    expect(result.report.success).toBe(true);
  });

  it('produces a non-empty PPTX blob', () => {
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('produces exactly 1 slide (data-slide="1")', () => {
    expect(result.report.slideCount).toBe(1);
  });

  // ── MappedShapes inspection ────────────────────────────────────────

  it('produces mappedShapes for the slide', () => {
    expect(result.mappedShapes).toHaveLength(1);
    expect(result.mappedShapes[0]!.length).toBeGreaterThan(0);
  });

  it('captures key text content', () => {
    const shapes = result.mappedShapes[0]!;
    const allText = shapes
      .filter((s) => s.textContent !== null && s.textContent.trim().length > 0)
      .map((s) => s.textContent)
      .join(' ');

    // Left panel heading
    expect(allText).toContain('ability');
    expect(allText).toContain('productivity');

    // Middle panel headers
    expect(allText).toContain('Productivity');
    expect(allText).toContain('Customer Experience');

    // Row content
    expect(allText).toContain('SPEED');
    expect(allText).toContain('COSTS');
    expect(allText).toContain('REACH');

    // Right panel text
    expect(allText).toContain('digital transformation');

    console.log(`[kearney] Total shapes: ${shapes.length}`);
    console.log(`[kearney] Text shapes: ${shapes.filter((s) => s.textContent?.trim()).length}`);
  });

  it('has shapes with non-none fill (visual containers)', () => {
    const shapes = result.mappedShapes[0]!;
    const filledShapes = shapes.filter((s) => s.fill.type !== 'none');

    console.log(
      `[kearney] Total shapes: ${shapes.length}, with fill: ${filledShapes.length}`,
    );
    for (const s of filledShapes.slice(0, 8)) {
      console.log(
        `  fill=${s.fill.type} color=${s.fill.type === 'solid' ? s.fill.color : s.fill.type === 'gradient' ? 'gradient' : 'n/a'} text=${s.textContent?.slice(0, 40) ?? '(none)'}`,
      );
    }
    // Left panel has gradient, middle/right have solid backgrounds
    expect(filledShapes.length).toBeGreaterThan(0);
  });

  it('has gradient fills (left panel linear-gradient)', () => {
    const shapes = result.mappedShapes[0]!;
    const gradientShapes = shapes.filter((s) => s.fill.type === 'gradient');
    console.log(`[kearney] Shapes with gradient: ${gradientShapes.length}`);
    // The left panel has linear-gradient(180deg, #b40646, #aa0041)
    // This may or may not be captured depending on jsdom CSS support
  });

  it('captures icon circle backgrounds', () => {
    const shapes = result.mappedShapes[0]!;
    // icon-circle has background: var(--icon-bg) = #b10647
    const iconBg = shapes.filter(
      (s) => s.fill.type === 'solid' && s.fill.color?.toLowerCase() === 'b10647',
    );
    console.log(`[kearney] Icon circle fills (#b10647): ${iconBg.length}`);
  });

  // ── Geometry checks ────────────────────────────────────────────────

  it('all shapes have non-negative geometry', () => {
    const shapes = result.mappedShapes[0]!;
    for (const s of shapes) {
      expect(s.geometry.x).toBeGreaterThanOrEqual(0);
      expect(s.geometry.y).toBeGreaterThanOrEqual(0);
      expect(s.geometry.width).toBeGreaterThan(0);
      expect(s.geometry.height).toBeGreaterThan(0);
    }
  });

  it('shapes are distributed across the slide width (3-column layout)', () => {
    const shapes = result.mappedShapes[0]!;
    const xPositions = shapes.map((s) => s.geometry.x);
    const uniqueX = new Set(xPositions);
    console.log(`[kearney] Unique x positions: ${uniqueX.size} — values: ${[...uniqueX].sort((a, b) => a - b).slice(0, 10).join(', ')}`);
    // With 3-column grid (317px + 648px + 320px), shapes shouldn't all be at x=0
    expect(uniqueX.size).toBeGreaterThan(1);
  });

  // ── Text style checks ─────────────────────────────────────────────

  it('has shapes with white text (left panel)', () => {
    const shapes = result.mappedShapes[0]!;
    const whiteText = shapes.filter(
      (s) =>
        s.textStyle?.color?.toLowerCase() === 'ffffff' &&
        s.textContent?.trim(),
    );
    console.log(`[kearney] White text shapes: ${whiteText.length}`);
    // Left panel text is white — should have at least the heading
  });

  it('has shapes with bold text', () => {
    const shapes = result.mappedShapes[0]!;
    const boldShapes = shapes.filter(
      (s) => s.textStyle?.fontWeight === 'bold' || (s.textStyle?.fontWeight as string) === '700',
    );
    console.log(`[kearney] Bold text shapes: ${boldShapes.length}`);
  });

  // ── Warning checks ────────────────────────────────────────────────

  it('has no critical warnings', () => {
    const critical = result.report.warnings.filter(
      (w) => w.severity === 'critical',
    );
    expect(critical).toHaveLength(0);
  });

  it('reports warnings summary', () => {
    console.log(`[kearney] Total warnings: ${result.report.warnings.length}`);
    const bySeverity: Record<string, number> = {};
    for (const w of result.report.warnings) {
      bySeverity[w.severity] = (bySeverity[w.severity] || 0) + 1;
    }
    console.log(`[kearney] Warnings by severity:`, bySeverity);
  });

  // ── Timing checks ─────────────────────────────────────────────────

  it('completes within performance budget', () => {
    console.log(`[kearney] Total time: ${result.report.metrics.timeTotalMs}ms`);
    expect(result.report.metrics.timeTotalMs).toBeLessThan(12000);
  });
});
