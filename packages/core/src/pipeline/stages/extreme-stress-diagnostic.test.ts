/**
 * Extreme stress-test diagnostic — dumps detailed shape and warning data
 * for the HTML test runner skill inspection.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from '../../convert';
import type { ConversionResult } from '../../types';
import JSZip from 'jszip';

const FIXTURE_DIR = resolve(__dirname, '../../../../../tests/fixtures/extreme-stress');

function loadFixture() {
  const html = readFileSync(resolve(FIXTURE_DIR, 'index.html'), 'utf-8');
  const css = readFileSync(resolve(FIXTURE_DIR, 'styles.css'), 'utf-8');
  const assets = new Map<string, Blob>();
  assets.set('index.html', new Blob([html], { type: 'text/html' }));
  assets.set('styles.css', new Blob([css], { type: 'text/css' }));
  return { html, assets };
}

describe('Extreme stress diagnostic', () => {
  let result: ConversionResult;

  beforeAll(async () => {
    const fixture = loadFixture();
    result = await convert(fixture.html, fixture.assets);
  });

  it('dumps full shape details per slide', () => {
    for (let si = 0; si < result.mappedShapes.length; si++) {
      const shapes = result.mappedShapes[si]!;
      console.log(`\n=== SLIDE ${si + 1} (${shapes.length} shapes) ===`);
      for (const s of shapes) {
        const fillInfo = s.fill.type === 'solid'
          ? `solid:${s.fill.color}`
          : s.fill.type === 'gradient'
            ? `gradient`
            : 'none';
        const borderInfo = s.border.style !== 'none' && s.border.width > 0
          ? `${s.border.style}:${s.border.width}px:${s.border.color}`
          : 'none';
        const shadowInfo = s.shadow ? `shadow(${s.shadow.offsetX},${s.shadow.offsetY},${s.shadow.blur})` : 'none';
        console.log(
          `  fill=${fillInfo} border=${borderInfo} shadow=${shadowInfo} ` +
          `geo={x:${Math.round(s.geometry.x)},y:${Math.round(s.geometry.y)},w:${Math.round(s.geometry.width)},h:${Math.round(s.geometry.height)}} ` +
          `text="${(s.textContent ?? '').slice(0, 50)}" ` +
          `font=${s.textStyle?.fontFamily || '-'} size=${s.textStyle?.fontSize ?? '-'} weight=${s.textStyle?.fontWeight ?? '-'} color=${s.textStyle?.color ?? '-'} align=${s.textStyle?.textAlign ?? '-'}`
        );
      }
    }
    expect(true).toBe(true);
  });

  it('dumps all warnings grouped by code', () => {
    const byCode: Record<string, number> = {};
    for (const w of result.report.warnings) {
      const key = `[${w.severity}] ${w.code}: ${w.property}`;
      byCode[key] = (byCode[key] || 0) + 1;
    }
    console.log('\n=== WARNING SUMMARY ===');
    for (const [key, count] of Object.entries(byCode).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${key} — x${count}`);
    }
    console.log(`Total: ${result.report.warnings.length}`);
    expect(true).toBe(true);
  });

  it('validates PPTX XML structure', async () => {
    // jsdom Blob doesn't support arrayBuffer() — use the internal buffer
    let arrayBuffer: ArrayBuffer;
    if (typeof result.blob.arrayBuffer === 'function') {
      arrayBuffer = await result.blob.arrayBuffer();
    } else {
      // Fallback for jsdom: read via FileReader-like approach
      const text = await new Promise<ArrayBuffer>((resolve) => {
        const reader = new (globalThis as unknown as { FileReader: typeof FileReader }).FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.readAsArrayBuffer(result.blob);
      });
      arrayBuffer = text;
    }
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Check content types
    const contentTypes = await zip.file('[Content_Types].xml')?.async('string');
    expect(contentTypes).toBeDefined();
    console.log('\n=== PPTX STRUCTURE ===');

    const slideFiles = Object.keys(zip.files).filter(f => f.match(/ppt\/slides\/slide\d+\.xml$/));
    console.log(`Slide XML files: ${slideFiles.length}`);
    expect(slideFiles.length).toBe(3);

    for (const slidePath of slideFiles.sort()) {
      const xml = await zip.file(slidePath)?.async('string');
      if (!xml) continue;

      const shapeCount = (xml.match(/<p:sp>/g) || []).length;
      const solidFills = (xml.match(/<a:solidFill>/g) || []).length;
      const gradFills = (xml.match(/<a:gradFill>/g) || []).length;
      const noFills = (xml.match(/<a:noFill/g) || []).length;
      const textBodies = (xml.match(/<p:txBody>/g) || []).length;
      const algn = (xml.match(/algn="/g) || []).length;

      console.log(
        `  ${slidePath}: shapes=${shapeCount} solidFill=${solidFills} gradFill=${gradFills} noFill=${noFills} textBody=${textBodies} algn=${algn}`
      );

      // Validate basic structure
      expect(xml).toContain('<p:sld');
      expect(xml).toContain('<p:spTree');
    }
  });

  it('dumps conversion metrics', () => {
    console.log('\n=== METRICS ===');
    console.log(`  success: ${result.report.success}`);
    console.log(`  slideCount: ${result.report.slideCount}`);
    console.log(`  totalTime: ${result.report.metrics.timeTotalMs}ms`);
    console.log(`  blobSize: ${result.blob.size} bytes`);
    expect(result.report.success).toBe(true);
  });
});
