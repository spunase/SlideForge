# SlideForge

Convert supported HTML documents into editable PowerPoint presentations in seconds.
Local-first by default, benchmarked for speed, and explicit about fidelity boundaries.

## Core Value

- High-fidelity conversion for documented supported CSS features.
- Editable output for text and key shapes.
- Fast performance with measurable SLOs.
- Local processing by default for privacy.

## Feature Summary

- HTML and zip/folder asset upload.
- Marker-based multi-slide segmentation.
- Slide size options: 16:9, 4:3, A4, custom.
- Progressive preview generation.
- Conversion report with warnings and substitutions.

## Documentation

- `docs/requirements.md`
- `docs/acceptance-criteria.md`
- `docs/testing-strategy.md`
- `docs/architecture.md`
- `docs/performance-budget.md`
- `docs/output-quality-rubric.md`
- `docs/css-support-matrix.md`
- `docs/error-taxonomy.md`
- `docs/benchmark-fixtures.md`

## Notes on Scope

- "Pixel perfect" applies to supported fixture classes and properties documented in the CSS support matrix.
- Unsupported features always trigger explicit warnings in conversion reports.

## Getting Started

```bash
npm install
npm run dev
```
