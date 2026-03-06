/**
 * Diagnostic script — runs SlideWorks through the pipeline and dumps
 * detailed shape/warning/fill data for inspection.
 * Run: node --experimental-vm-modules tests/fixtures/slideworks/diagnostic.cjs
 * (Actually we'll call this from jest)
 */
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

// This is just the data; the actual test will import convert and produce JSON output.
const FIXTURE_DIR = __dirname;
const HTML_PATH = resolve(FIXTURE_DIR, 'index.html');
const CSS_PATH = resolve(FIXTURE_DIR, 'styles.css');

console.log('HTML size:', readFileSync(HTML_PATH, 'utf-8').length, 'bytes');
console.log('CSS size:', readFileSync(CSS_PATH, 'utf-8').length, 'bytes');

// Count sections in HTML
const html = readFileSync(HTML_PATH, 'utf-8');
const sectionCount = (html.match(/<section/g) || []).length;
console.log('Section count:', sectionCount);

// Count CSS custom properties
const css = readFileSync(CSS_PATH, 'utf-8');
const varDefs = (css.match(/--sw-[a-z0-9-]+/g) || []);
const uniqueVars = [...new Set(varDefs)];
console.log('CSS custom properties:', uniqueVars.length, uniqueVars);

// Count var() usages
const varUsages = (css.match(/var\(--sw-/g) || []).length;
console.log('var() usages in CSS:', varUsages);
