# Output Quality Rubric

Last Updated: 2026-03-04

## 1. Purpose

Define objective pass/fail criteria for conversion quality across supported fixtures.

## 2. Dimensions and Weights

| Dimension | Weight | Description |
|---|---:|---|
| Visual fidelity | 40% | Similarity between source render and converted slide render |
| Editability | 30% | Ability to edit text and key objects in PowerPoint |
| Typography fidelity | 15% | Font matching and line-wrap stability |
| Structural fidelity | 15% | Preservation of list/table hierarchy and reading order |

## 3. Scoring Rules

### Visual Fidelity
- SSIM >=0.97 for supported fixtures: full points.
- SSIM 0.95 to 0.969: partial points.
- SSIM <0.95: fail.

### Editability
- 100% editable text on Tier A and Tier B fixtures: full points.
- Any text rasterization in Tier A fixtures: fail.

### Typography Fidelity
- Exact font when embeddable and licensed: full points.
- Mapped fallback with no overflow change: partial points.
- Unmapped fallback causing overflow/reflow break: fail.

### Structural Fidelity
- Lists, tables, and reading order preserved: full points.
- Minor ordering drift without content loss: partial points.
- Lost hierarchy or merged content: fail.

## 4. Release Thresholds

- Overall weighted score must be >=90/100.
- No fail in Editability dimension for Tier A fixtures.
- Critical fixture set cannot contain any dimension-level fail.

## 5. Reporting Format

Each fixture report includes:
- Fixture id
- Dimension scores
- Failed checks with error codes
- Screenshot diff references
- Fallbacks applied

## 6. Use with CSS Support Matrix

Rubric evaluation only applies to features marked Tier A or Tier B in `docs/css-support-matrix.md`.
Tier C features are expected to trigger warnings and fallback reporting.
