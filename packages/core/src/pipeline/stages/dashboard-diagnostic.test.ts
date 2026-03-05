/**
 * Dashboard Diagnostic Test
 *
 * Logs the full conversion report (warnings, metrics, font substitutions)
 * and the computedStyles for the first few shapes. This tells us exactly
 * what the pipeline saw when processing the dashboard fixture.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from '../../convert';
import { ingest } from './ingest';
import { render } from './render';
import { extract } from './extract';
import type { ConversionResult, ExtractedElement } from '../../types';

const FIXTURE_DIR = resolve(__dirname, '../../../../../tests/fixtures/dashboard');
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

function flattenShapes(shapes: import('../../types').MappedShape[]): import('../../types').MappedShape[] {
  return shapes;
}

describe('Dashboard Diagnostic', () => {
  let result: ConversionResult;
  let fixture: { html: string; assets: Map<string, Blob> };

  beforeAll(async () => {
    fixture = loadFixture();
    result = await convert(fixture.html, fixture.assets);
  });

  it('logs the full conversion report', () => {
    console.log('\n========== CONVERSION REPORT ==========\n');

    console.log('--- WARNINGS ---');
    if (result.report.warnings.length === 0) {
      console.log('  (none)');
    } else {
      for (const w of result.report.warnings) {
        console.log(
          `  [${w.severity.toUpperCase()}] code=${w.code} property=${w.property} msg="${w.message}"${w.original ? ` original="${w.original}"` : ''}`,
        );
      }
    }

    console.log('\n--- METRICS ---');
    const m = result.report.metrics;
    console.log(`  timeIngestMs:   ${m.timeIngestMs}`);
    console.log(`  timeRenderMs:   ${m.timeRenderMs}`);
    console.log(`  timeAnalyzeMs:  ${m.timeAnalyzeMs}`);
    console.log(`  timePackageMs:  ${m.timePackageMs}`);
    console.log(`  timeTotalMs:    ${m.timeTotalMs}`);
    console.log(`  peakMemoryMb:   ${m.peakMemoryMb}`);
    console.log(`  outputSizeMb:   ${m.outputSizeMb}`);

    console.log('\n--- FONT SUBSTITUTIONS ---');
    if (result.report.fontSubstitutions.length === 0) {
      console.log('  (none)');
    } else {
      for (const fs of result.report.fontSubstitutions) {
        console.log(`  "${fs.original}" → "${fs.replacement}"`);
      }
    }

    console.log('\n--- UNSUPPORTED RULES ---');
    if (result.report.unsupportedRules.length === 0) {
      console.log('  (none)');
    } else {
      for (const r of result.report.unsupportedRules) {
        console.log(`  tier=${r.tier} property=${r.property} value=${r.value}`);
      }
    }

    console.log('\n--- SUMMARY ---');
    console.log(`  success:     ${result.report.success}`);
    console.log(`  slideCount:  ${result.report.slideCount}`);
    console.log(`  warnings:    ${result.report.warnings.length}`);
    console.log(`  fontSubs:    ${result.report.fontSubstitutions.length}`);
    console.log(`  unsupported: ${result.report.unsupportedRules.length}`);

    expect(result.report).toBeDefined();
  });

  it('logs the first 5 mapped shapes details', () => {
    const shapes = result.mappedShapes[0] ?? [];
    console.log(`\n========== MAPPED SHAPES (slide 0, total: ${shapes.length}) ==========\n`);

    const first5 = shapes.slice(0, 5);
    for (let i = 0; i < first5.length; i++) {
      const s = first5[i]!;
      console.log(`--- Shape ${i} ---`);
      console.log(`  tagLine:       (from extract)`);
      console.log(`  textContent:   ${s.textContent !== null ? JSON.stringify(s.textContent.slice(0, 80)) : 'null'}`);
      console.log(`  fill.type:     ${s.fill.type}`);
      console.log(`  fill.color:    ${s.fill.type === 'solid' ? s.fill.color : 'n/a'}`);
      console.log(`  fill.alpha:    ${s.fill.alpha !== undefined ? s.fill.alpha : 'n/a'}`);
      if (s.fill.type === 'gradient' && s.fill.gradientStops) {
        console.log(`  fill.gradient stops:`);
        for (const stop of s.fill.gradientStops) {
          console.log(`    pos=${stop.position}% color=${stop.color}`);
        }
      }
      console.log(`  border.style:  ${s.border.style}`);
      console.log(`  border.width:  ${s.border.width}`);
      console.log(`  border.color:  ${s.border.color}`);
      console.log(`  border.radius: ${s.border.radius !== undefined ? s.border.radius : 'n/a'}`);
      console.log(`  shadow:        ${s.shadow !== null ? JSON.stringify(s.shadow) : 'null'}`);
      console.log(`  geometry:      x=${s.geometry.x} y=${s.geometry.y} w=${s.geometry.width} h=${s.geometry.height} z=${s.geometry.zIndex}`);
      if (s.textStyle) {
        console.log(`  textStyle.fontFamily: ${s.textStyle.fontFamily}`);
        console.log(`  textStyle.fontSize:   ${s.textStyle.fontSize}`);
        console.log(`  textStyle.color:      ${s.textStyle.color}`);
      } else {
        console.log(`  textStyle:     null`);
      }
      if (s.warnings.length > 0) {
        console.log(`  warnings (${s.warnings.length}):`);
        for (const w of s.warnings) {
          console.log(`    [${w.severity}] ${w.code}: ${w.message}`);
        }
      }
    }

    expect(shapes.length).toBeGreaterThan(0);
  });

  it('logs raw computedStyles from the extract stage directly', async () => {
    const { html, assets } = fixture;

    // Step 1: ingest
    const { segments } = ingest(html);
    console.log(`\n========== DIRECT EXTRACT STAGE (segments: ${segments.length}) ==========\n`);

    // Step 2: render
    const { documents, cleanup } = await render(segments, { slideWidth: 1920, slideHeight: 1080 }, assets);
    console.log(`  Rendered ${documents.length} document(s)`);

    // Step 3: extract
    const { slides } = extract(documents, 1920);
    console.log(`  Extracted ${slides.length} slide(s)`);

    const slideElements = slides[0] ?? [];
    console.log(`  Elements in slide 0: ${slideElements.length}`);

    // Flatten to get a breadth-first list of first 5 elements
    function flattenBFS(elements: ExtractedElement[], limit: number): ExtractedElement[] {
      const result: ExtractedElement[] = [];
      const queue = [...elements];
      while (queue.length > 0 && result.length < limit) {
        const el = queue.shift()!;
        result.push(el);
        queue.push(...el.children);
      }
      return result;
    }

    const first5 = flattenBFS(slideElements, 5);
    console.log(`\n--- First 5 extracted elements (BFS) ---`);

    for (let i = 0; i < first5.length; i++) {
      const el = first5[i]!;
      console.log(`\n  Element ${i}: <${el.tagName}>`);
      console.log(`    slideIndex:   ${el.slideIndex}`);
      console.log(`    textContent:  ${el.textContent !== null ? JSON.stringify(el.textContent.slice(0, 80)) : 'null'}`);
      console.log(`    geometry:     x=${el.geometry.x} y=${el.geometry.y} w=${el.geometry.width} h=${el.geometry.height} z=${el.geometry.zIndex}`);
      console.log(`    computedStyles:`);
      const cs = el.computedStyles;
      const keys = Object.keys(cs);
      if (keys.length === 0) {
        console.log(`      (empty — no tracked styles found)`);
      } else {
        for (const key of keys) {
          console.log(`      ${key}: ${cs[key]}`);
        }
      }
      console.log(`    children count: ${el.children.length}`);
    }

    if (cleanup) {
      cleanup();
    }

    expect(slides.length).toBeGreaterThan(0);
  });
});
