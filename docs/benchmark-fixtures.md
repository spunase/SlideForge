# Benchmark Fixtures

Last Updated: 2026-03-04

## 1. Fixture Classes

| Fixture ID | Class | Description | Target Use |
|---|---|---|---|
| FX-BASIC-001 | Basic | Single slide, <=200 elements, text + images | Smoke and sanity |
| FX-BASIC-002 | Basic | Multi-slide markers with simple typography | Segmentation |
| FX-CSS-001 | Advanced CSS | Gradients, borders, shadows, radius | Fidelity checks |
| FX-CSS-002 | Advanced CSS | Flex layout, nested lists, table styles | Structure checks |
| FX-CSS-003 | Advanced CSS | Kearney three-column infographic replica (`tests/fixtures/kearney/index.html` + `styles.css`) | High-density layout and typography fidelity |
| FX-ASSET-001 | Asset-heavy | External CSS + images + custom fonts | Asset resolution |
| FX-ASSET-002 | Asset-heavy | Dashboard fixture bundle (`tests/fixtures/dashboard/index.html` + `styles.css`) | Linked stylesheet resolution |
| FX-STRESS-001 | Stress | 10 slides, <=2000 elements | Performance SLO |
| FX-STRESS-002 | Stress | Large asset bundle near memory threshold | Memory safety |

## 2. Per-Fixture Metadata

Each fixture must define:
- Source files and asset manifest.
- Expected slide count.
- Expected warnings and allowed error codes.
- Quality targets (SSIM, drift, editability).
- Performance class and expected timing budget.

## 3. Execution Matrix

Required runs:
- PR level: FX-BASIC-001, FX-BASIC-002, FX-CSS-001.
- Nightly: full fixture suite.
- Release candidate: full suite across all supported browsers.

## 4. Artifact Requirements

Each benchmark run publishes:
- Stage timing table.
- Memory and output size metrics.
- Visual diff outputs.
- Conversion report JSON.

## 5. Change Control

- New converter feature must add or update at least one fixture.
- Any fixture expectation change requires rationale in pull request.
- Fixture removals require QA approval.
