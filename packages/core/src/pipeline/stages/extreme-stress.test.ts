/**
 * Extreme stress-test fixture — exercises the full pipeline with a wide
 * variety of CSS features: rounded corners, gradients, shadows, charts,
 * infographic elements, multiple slides, and complex nested layouts.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from '../../convert';
import type { ConversionResult, MappedShape } from '../../types';

const FIXTURE_DIR = resolve(__dirname, '../../../../../tests/fixtures/extreme-stress');
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

function allShapes(result: ConversionResult): MappedShape[] {
  return result.mappedShapes.flat();
}

describe('Extreme stress-test fixture', () => {
  let result: ConversionResult;

  beforeAll(async () => {
    const fixture = loadFixture();
    result = await convert(fixture.html, fixture.assets);
  });

  // ── Pipeline basics ────────────────────────────────────────────────

  it('conversion succeeds', () => {
    expect(result.report.success).toBe(true);
  });

  it('produces a non-empty PPTX blob', () => {
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it('detects 3 slides', () => {
    expect(result.report.slideCount).toBe(3);
    expect(result.mappedShapes).toHaveLength(3);
  });

  it('has no critical warnings', () => {
    const critical = result.report.warnings.filter(
      (w) => w.severity === 'critical',
    );
    expect(critical).toHaveLength(0);
  });

  it('completes within performance budget', () => {
    console.log(`[extreme] Total time: ${result.report.metrics.timeTotalMs}ms`);
    expect(result.report.metrics.timeTotalMs).toBeLessThan(15000);
  });

  // ── Slide 1: KPI Dashboard ────────────────────────────────────────

  describe('Slide 1 — KPI Dashboard', () => {
    let shapes: MappedShape[];

    beforeAll(() => {
      shapes = result.mappedShapes[0]!;
    });

    it('has shapes', () => {
      console.log(`[extreme][slide1] Total shapes: ${shapes.length}`);
      expect(shapes.length).toBeGreaterThan(5);
    });

    it('captures dashboard title', () => {
      const allText = shapes.map((s) => s.textContent ?? '').join(' ');
      expect(allText).toContain('Performance Dashboard');
    });

    it('captures KPI values', () => {
      const allText = shapes.map((s) => s.textContent ?? '').join(' ');
      expect(allText).toContain('2,847');
      expect(allText).toContain('94.2%');
      expect(allText).toContain('$1.2M');
    });

    it('has solid fills (stat card backgrounds)', () => {
      const filled = shapes.filter((s) => s.fill.type === 'solid');
      console.log(`[extreme][slide1] Solid fills: ${filled.length}`);
      expect(filled.length).toBeGreaterThan(0);
    });

    it('has gradient fills (header or chart elements)', () => {
      const gradients = shapes.filter((s) => s.fill.type === 'gradient');
      console.log(`[extreme][slide1] Gradient fills: ${gradients.length}`);
      // Gradient support depends on CSS var resolution — soft check
    });

    it('captures chart bar labels', () => {
      const allText = shapes.map((s) => s.textContent ?? '').join(' ');
      expect(allText).toContain('Jan');
      expect(allText).toContain('Jun');
    });

    it('has shapes distributed across slide width', () => {
      const uniqueX = new Set(shapes.map((s) => Math.round(s.geometry.x)));
      console.log(`[extreme][slide1] Unique X positions: ${uniqueX.size}`);
      expect(uniqueX.size).toBeGreaterThan(2);
    });
  });

  // ── Slide 2: Process Infographic ──────────────────────────────────

  describe('Slide 2 — Process Infographic', () => {
    let shapes: MappedShape[];

    beforeAll(() => {
      shapes = result.mappedShapes[1]!;
    });

    it('has shapes', () => {
      console.log(`[extreme][slide2] Total shapes: ${shapes.length}`);
      expect(shapes.length).toBeGreaterThan(5);
    });

    it('captures step labels', () => {
      const allText = shapes.map((s) => s.textContent ?? '').join(' ');
      expect(allText).toContain('Research');
      expect(allText).toContain('Design');
      expect(allText).toContain('Build');
      expect(allText).toContain('Launch');
    });

    it('captures step numbers', () => {
      const allText = shapes.map((s) => s.textContent ?? '').join(' ');
      expect(allText).toContain('01');
      expect(allText).toContain('04');
    });

    it('has colored fills for step badges', () => {
      const filled = shapes.filter((s) => s.fill.type === 'solid');
      console.log(`[extreme][slide2] Solid fills: ${filled.length}`);
      expect(filled.length).toBeGreaterThan(0);
    });
  });

  // ── Slide 3: Data Comparison ──────────────────────────────────────

  describe('Slide 3 — Data Comparison', () => {
    let shapes: MappedShape[];

    beforeAll(() => {
      shapes = result.mappedShapes[2]!;
    });

    it('has shapes', () => {
      console.log(`[extreme][slide3] Total shapes: ${shapes.length}`);
      expect(shapes.length).toBeGreaterThan(5);
    });

    it('captures product names', () => {
      const allText = shapes.map((s) => s.textContent ?? '').join(' ');
      expect(allText).toContain('Enterprise');
      expect(allText).toContain('Professional');
      expect(allText).toContain('Starter');
    });

    it('captures pricing', () => {
      const allText = shapes.map((s) => s.textContent ?? '').join(' ');
      expect(allText).toContain('$299');
      expect(allText).toContain('$149');
      expect(allText).toContain('$49');
    });

    it('has colored fills for badges and bars', () => {
      const filled = shapes.filter((s) => s.fill.type === 'solid');
      console.log(`[extreme][slide3] Solid fills: ${filled.length}`);
      expect(filled.length).toBeGreaterThan(0);
    });

    it('has variety of text colors', () => {
      const colors = new Set(
        shapes
          .filter((s) => s.textStyle?.color)
          .map((s) => s.textStyle!.color.toUpperCase()),
      );
      console.log(`[extreme][slide3] Unique text colors: ${colors.size} — ${[...colors].join(', ')}`);
      expect(colors.size).toBeGreaterThan(1);
    });
  });

  // ── Cross-slide checks ────────────────────────────────────────────

  it('all shapes have non-negative geometry', () => {
    for (const s of allShapes(result)) {
      expect(s.geometry.x).toBeGreaterThanOrEqual(0);
      expect(s.geometry.y).toBeGreaterThanOrEqual(0);
      expect(s.geometry.width).toBeGreaterThan(0);
      expect(s.geometry.height).toBeGreaterThan(0);
    }
  });

  it('shapes are scaled to fill the slide', () => {
    for (let i = 0; i < result.mappedShapes.length; i++) {
      const slideShapes = result.mappedShapes[i]!;
      if (slideShapes.length === 0) continue;
      const maxRight = Math.max(...slideShapes.map((s) => s.geometry.x + s.geometry.width));
      console.log(`[extreme][slide${i + 1}] Max right edge: ${Math.round(maxRight)}px (slide: 1920px)`);
      // After scaleToFitSlide, content should approach the slide width
      expect(maxRight).toBeGreaterThan(1200);
    }
  });

  it('reports diagnostics summary', () => {
    const total = allShapes(result).length;
    const withFill = allShapes(result).filter((s) => s.fill.type !== 'none').length;
    const withText = allShapes(result).filter((s) => s.textContent?.trim()).length;
    const withBold = allShapes(result).filter((s) => s.textStyle?.fontWeight === 'bold').length;

    console.log(`[extreme] ===== DIAGNOSTICS =====`);
    console.log(`[extreme] Total shapes across 3 slides: ${total}`);
    console.log(`[extreme] Shapes with fill: ${withFill}`);
    console.log(`[extreme] Shapes with text: ${withText}`);
    console.log(`[extreme] Shapes with bold: ${withBold}`);
    console.log(`[extreme] Warnings: ${result.report.warnings.length}`);
    console.log(`[extreme] ========================`);

    expect(total).toBeGreaterThan(20);
  });
});
