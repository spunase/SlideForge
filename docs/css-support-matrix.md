# CSS Support Matrix

Last Updated: 2026-03-04

## 1. Support Tiers

- Tier A: Fully supported and must pass quality gates.
- Tier B: Supported with approximation; warnings allowed.
- Tier C: Unsupported; warning and deterministic fallback required.

## 2. Property Coverage

| Area | Example Properties | Tier | Fallback Rule |
|---|---|---|---|
| Text color and size | `color`, `font-size`, `font-weight` | A | N/A |
| Text alignment and spacing | `text-align`, `line-height`, `letter-spacing` | A | Clamp to nearest PowerPoint equivalent |
| Background colors | `background-color` | A | N/A |
| Borders and radius | `border-*`, `border-radius` | A | Radius approximation allowed within 2 px |
| Box shadows | `box-shadow` | B | Approximate with outer shadow model |
| Text shadows | `text-shadow` | B | Approximate with nearest supported shadow |
| Gradients | `linear-gradient`, `radial-gradient` | B | Convert to nearest gradient stops |
| Basic transforms | `translate`, `scale` | B | Resolve to final computed geometry |
| Complex transforms | `matrix3d`, nested transforms | C | Flatten geometry and warn |
| Filters | `filter: blur()`, `drop-shadow()` | C | Omit filter, preserve base object |
| Layout flex basic | common `display:flex` row/column | B | Use computed absolute positions |
| Layout grid complex | dense/auto placement rules | C | Use computed final boxes and warn |
| Positioning | `position: absolute/relative` | A | N/A |
| SVG images | external or inline simple SVG | B | Rasterize SVG image with warning if needed |
| Blend modes | `mix-blend-mode` | C | Ignore blend and warn |

## 3. Font Handling Rules

- Embed font only when source file is available and license allows embedding.
- Use deterministic fallback map when embedding is not possible.

Fallback map baseline:
- Inter -> Arial
- Roboto -> Calibri
- Helvetica -> Arial
- Georgia -> Times New Roman
- Fira Code -> Consolas

All substitutions must be listed in conversion report.

## 4. Support Commitments

- Tier A and Tier B are in release quality gates.
- Tier C must not silently fail.
- Tier changes require update to acceptance criteria and fixture expectations.
