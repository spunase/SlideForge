/**
 * SlideWorks fixture integration test — 216-slide consulting deck stress test.
 * Exercises the full pipeline with external CSS, CSS custom properties,
 * section-based slide segmentation, and diverse slide types.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from '../../convert';
import type { ConversionResult } from '../../types';

const FIXTURE_DIR = resolve(__dirname, '../../../../../tests/fixtures/slideworks');
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

describe('SlideWorks 216-slide integration', () => {
  let result: ConversionResult;

  beforeAll(async () => {
    const fixture = loadFixture();
    result = await convert(fixture.html, fixture.assets);
  }, 120_000); // 2 minute timeout for 216 slides

  // ── Pipeline result ────────────────────────────────────────────────

  it('conversion succeeds', () => {
    expect(result.report.success).toBe(true);
  });

  it('produces a non-empty PPTX blob', () => {
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('produces exactly 216 slides', () => {
    expect(result.report.slideCount).toBe(216);
  });

  // ── MappedShapes inspection ────────────────────────────────────────

  it('produces mappedShapes for all 216 slides', () => {
    expect(result.mappedShapes).toHaveLength(216);
  });

  it('every slide has at least one shape', () => {
    for (let i = 0; i < result.mappedShapes.length; i++) {
      expect(result.mappedShapes[i]!.length).toBeGreaterThan(
        0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      );
    }
  });

  it('has shapes with text content across slides', () => {
    const slidesWithText = result.mappedShapes.filter((slide) =>
      slide.some((s) => s.textContent !== null && s.textContent.trim().length > 0),
    );
    // At least 90% of slides should have text
    expect(slidesWithText.length).toBeGreaterThanOrEqual(194);
  });

  it('has shapes with non-none fill (visual containers)', () => {
    let totalShapes = 0;
    let filledShapes = 0;
    for (const slide of result.mappedShapes) {
      for (const s of slide) {
        totalShapes++;
        if (s.fill.type !== 'none') filledShapes++;
      }
    }
    console.log(
      `[slideworks] Total shapes: ${totalShapes}, with fill: ${filledShapes}`,
    );
    // Should have significant filled shapes (backgrounds, charts, tables, etc.)
    expect(filledShapes).toBeGreaterThan(100);
  });

  // ── Warnings check ────────────────────────────────────────────────

  it('has no critical warnings', () => {
    const critical = (result.report.warnings ?? []).filter(
      (w) => w.severity === 'critical',
    );
    if (critical.length > 0) {
      console.warn('[slideworks] Critical warnings:', critical);
    }
    expect(critical).toHaveLength(0);
  });

  // ── Performance ────────────────────────────────────────────────────

  it('logs timing metrics', () => {
    const metrics = result.report.metrics;
    if (metrics) {
      console.log('[slideworks] Pipeline metrics:', JSON.stringify(metrics, null, 2));
    }
    // Just log, no hard time assertion for 216 slides in jsdom
  });

  // ── Sample slide content checks ────────────────────────────────────

  it('first slide contains cover text', () => {
    const shapes = result.mappedShapes[0]!;
    const allText = shapes
      .filter((s) => s.textContent)
      .map((s) => s.textContent)
      .join(' ');
    expect(allText).toContain('SlideWorks');
  });

  it('has diverse fill colors across slides', () => {
    const colors = new Set<string>();
    for (const slide of result.mappedShapes) {
      for (const s of slide) {
        if (s.fill.type === 'solid' && s.fill.color) {
          colors.add(s.fill.color);
        }
      }
    }
    console.log(`[slideworks] Unique fill colors: ${colors.size}`, [...colors].slice(0, 20));
    // With 216 slides of diverse types, expect many unique colors
    expect(colors.size).toBeGreaterThan(5);
  });
});
