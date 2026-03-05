/**
 * Dashboard Text Alignment Diagnostic Test
 *
 * Inspects the actual MappedShape output for every text-bearing shape from the
 * dashboard fixture. Reports geometry, textContent, and full textStyle properties
 * (especially textAlign) sorted by Y position, and checks for overlapping shapes.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { convert } from '../../convert';
import type { ConversionResult, MappedShape } from '../../types';

const FIXTURE_DIR = resolve(__dirname, '../../../../../tests/fixtures/dashboard');

function loadFixture(): { html: string; assets: Map<string, Blob> } {
  const html = readFileSync(resolve(FIXTURE_DIR, 'index.html'), 'utf-8');
  const css = readFileSync(resolve(FIXTURE_DIR, 'styles.css'), 'utf-8');

  const assets = new Map<string, Blob>();
  assets.set('index.html', new Blob([html], { type: 'text/html' }));
  assets.set('styles.css', new Blob([css], { type: 'text/css' }));

  return { html, assets };
}

describe('Dashboard Text Alignment Diagnostic', () => {
  let result: ConversionResult;

  beforeAll(async () => {
    const { html, assets } = loadFixture();
    result = await convert(html, assets);
  });

  it('logs geometry and textStyle for every text-bearing shape sorted by Y', () => {
    const shapes: MappedShape[] = result.mappedShapes[0] ?? [];
    const textShapes = shapes.filter((s) => s.textContent !== null && s.textContent.trim() !== '');

    // Sort by Y then X for a top-to-bottom, left-to-right reading order
    const sorted = [...textShapes].sort((a, b) => {
      if (a.geometry.y !== b.geometry.y) return a.geometry.y - b.geometry.y;
      return a.geometry.x - b.geometry.x;
    });

    console.log(`\n========== TEXT SHAPES (slide 0) ==========`);
    console.log(`Total shapes: ${shapes.length}  |  Shapes with text: ${textShapes.length}\n`);

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i]!;
      const geo = s.geometry;
      const ts = s.textStyle;
      const snippet = (s.textContent ?? '').slice(0, 50).replace(/\n/g, '\\n');

      console.log(`--- Text Shape ${i} ---`);
      console.log(`  text:       "${snippet}"`);
      console.log(`  geometry:   x=${geo.x}  y=${geo.y}  w=${geo.width}  h=${geo.height}  z=${geo.zIndex}`);
      if (ts) {
        console.log(`  textAlign:  ${ts.textAlign}`);
        console.log(`  fontSize:   ${ts.fontSize}`);
        console.log(`  fontFamily: ${ts.fontFamily}`);
        console.log(`  fontWeight: ${ts.fontWeight}`);
        console.log(`  fontStyle:  ${ts.fontStyle}`);
        console.log(`  color:      ${ts.color}  alpha=${ts.alpha}`);
        console.log(`  lineHeight: ${ts.lineHeight}`);
        console.log(`  letterSpacing: ${ts.letterSpacing}`);
        console.log(`  textDecoration: ${ts.textDecoration}`);
      } else {
        console.log(`  textStyle:  null`);
      }
    }

    // -----------------------------------------------------------------------
    // Check 1: is textAlign ever non-'left'?
    // -----------------------------------------------------------------------
    console.log(`\n========== TEXT-ALIGN SUMMARY ==========`);
    const alignCounts: Record<string, number> = {};
    for (const s of textShapes) {
      const align = s.textStyle?.textAlign ?? '(no textStyle)';
      alignCounts[align] = (alignCounts[align] ?? 0) + 1;
    }
    for (const [align, count] of Object.entries(alignCounts)) {
      console.log(`  ${align}: ${count} shape(s)`);
    }
    const allLeft = Object.keys(alignCounts).every((k) => k === 'left' || k === '(no textStyle)');
    if (allLeft) {
      console.log(`  *** textAlign is ALWAYS 'left' — possible capture bug ***`);
    } else {
      console.log(`  textAlign IS varied — capture appears to be working`);
    }

    // -----------------------------------------------------------------------
    // Check 2: overlapping shapes (same or very close Y, different X)
    // -----------------------------------------------------------------------
    console.log(`\n========== OVERLAP ANALYSIS ==========`);
    const Y_THRESHOLD = 5; // px — shapes within 5 px of each other in Y
    const overlapping: Array<[MappedShape, MappedShape]> = [];

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i]!;
        const b = sorted[j]!;
        const yDiff = Math.abs(a.geometry.y - b.geometry.y);
        if (yDiff <= Y_THRESHOLD) {
          overlapping.push([a, b]);
        }
      }
    }

    if (overlapping.length === 0) {
      console.log(`  No overlapping text shapes found (threshold: ${Y_THRESHOLD}px).`);
    } else {
      console.log(`  Found ${overlapping.length} overlapping pair(s) (threshold: ${Y_THRESHOLD}px):`);
      for (const [a, b] of overlapping) {
        const snippetA = (a.textContent ?? '').slice(0, 30).replace(/\n/g, '\\n');
        const snippetB = (b.textContent ?? '').slice(0, 30).replace(/\n/g, '\\n');
        console.log(
          `    "${snippetA}" (y=${a.geometry.y}, x=${a.geometry.x})` +
          `  <-->  "${snippetB}" (y=${b.geometry.y}, x=${b.geometry.x})`,
        );
      }
    }

    // -----------------------------------------------------------------------
    // Check 3: shapes where text content implies center/right but align='left'
    // -----------------------------------------------------------------------
    console.log(`\n========== POTENTIAL MISALIGNED SHAPES ==========`);
    // A rough heuristic: shape is near horizontal center of slide (1920/2 = 960)
    // and text is short — likely a centered heading/label
    const SLIDE_WIDTH = 1920;
    const potentialCenter = sorted.filter((s) => {
      const midX = s.geometry.x + s.geometry.width / 2;
      const distFromCenter = Math.abs(midX - SLIDE_WIDTH / 2);
      return distFromCenter < 100 && s.textStyle?.textAlign === 'left';
    });
    if (potentialCenter.length === 0) {
      console.log(`  No likely-misaligned centered shapes found.`);
    } else {
      console.log(`  ${potentialCenter.length} shape(s) appear centered on slide but have textAlign='left':`);
      for (const s of potentialCenter) {
        const snippet = (s.textContent ?? '').slice(0, 40).replace(/\n/g, '\\n');
        console.log(`    "${snippet}"  x=${s.geometry.x}  y=${s.geometry.y}  w=${s.geometry.width}`);
      }
    }

    expect(textShapes.length).toBeGreaterThan(0);
  });
});
