# Testing Strategy

Last Updated: 2026-03-04

## 1. Objectives

- Prevent regressions in conversion fidelity, speed, and editability.
- Keep releases deterministic across supported browsers.
- Enforce measurable quality gates in CI.

## 2. Test Pyramid

### Unit Tests
- Scope: style mapping, unit conversion (px to EMU), segmentation logic, fallback logic, error mapping.
- Tools: Jest + jsdom where practical.
- Requirement: high branch coverage on conversion-critical modules.

### Integration Tests
- Scope: end-to-end conversion pipeline from HTML + assets to PPTX Blob.
- Tools: headless browser for style extraction + XML validation of output package.
- Checks: slide count, object count sanity, mandatory OOXML nodes.

### Visual Regression Tests
- Render baseline HTML fixtures to PNG.
- Convert fixtures to PPTX, render slides to PNG, compare image sets.
- Metrics: SSIM and pixel drift thresholds from requirements.

### End-to-End UI Tests
- Scope: upload, preview, options, conversion, download, error recovery.
- Tools: browser automation with keyboard-only flows included.

### Manual Exploratory Tests
- Real-world HTML documents and high-risk CSS combinations.
- Browser-specific behavior and large document stress.

## 3. Fixture Strategy

Fixture catalog is defined in `docs/benchmark-fixtures.md` and must include:
- Basic single-slide fixtures.
- Multi-slide fixtures with markers.
- Complex CSS fixtures.
- Asset-heavy fixtures.
- Stress fixtures up to documented limits.

Each fixture has:
- Input files.
- Expected slide count.
- Expected warnings.
- Performance class.

## 4. Performance Benchmarks

Benchmark protocol is defined in `docs/performance-budget.md`.

Required benchmark outputs per run:
- Stage timings (`parse`, `analyze`, `map`, `package`).
- Total conversion duration.
- Main-thread long task count.
- Peak memory usage.
- Output PPTX size.

## 5. CI Quality Gates

| Gate | Threshold | Blocking |
|---|---|---|
| Unit coverage on conversion-critical modules | >=90% statements | Yes |
| Visual fidelity on supported fixture suite | SSIM >=0.97 and pixel drift within budget | Yes |
| Performance regression | <=10% slowdown vs baseline median | Yes |
| Accessibility smoke | 0 critical axe issues | Yes |
| Cross-browser smoke | Pass on Chrome, Edge, Firefox, Safari | Release block |

## 6. Flake and Stability Policy

- Any test with >2% flake rate over rolling 20 runs is quarantined and ticketed.
- Quarantined tests cannot remain quarantined for more than one sprint.
- Release branch cannot ship with flaky critical-path tests.

## 7. Defect Severity and Triage

Severity model follows `docs/error-taxonomy.md`.

- Critical: data loss, broken conversion output, crash without recovery.
- High: major fidelity regression, repeated failure on supported fixtures.
- Medium: fallback message issues, non-blocking UI/accessibility regressions.
- Low: cosmetic issues that do not impact conversion correctness.

## 8. Release Readiness Checklist

- All acceptance criteria passed.
- CI quality gates green.
- Benchmark report attached for release candidate.
- Known deviations from CSS support matrix documented in release notes.
