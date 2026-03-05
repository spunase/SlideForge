# Error Taxonomy

Last Updated: 2026-03-04

## 1. Severity Levels

- Critical: conversion cannot produce usable output or app crashes.
- High: major fidelity or data integrity issue in supported scenario.
- Medium: recoverable feature degradation with workaround.
- Low: cosmetic or minor usability issue.

## 2. Error Codes

| Code | Severity | Category | User Message | Recovery Action |
|---|---|---|---|---|
| SF-INPUT-001 | High | Input | Unsupported file type. Upload HTML or zip bundle. | Choose supported input |
| SF-INPUT-002 | High | Input | HTML file is empty or unreadable. | Re-export source HTML |
| SF-ASSET-001 | Medium | Asset | Some linked assets were not found. | Re-upload bundle with missing files |
| SF-ASSET-002 | Medium | Asset | Font file unavailable for embedding. Substitution applied. | Review fallback font list |
| SF-CSS-001 | Medium | CSS | Unsupported CSS property was approximated. | Check conversion report |
| SF-CSS-002 | High | CSS | Unsupported layout pattern caused visible drift. | Simplify source layout or split content |
| SF-CONVERT-001 | Critical | Runtime | Conversion failed before output generation. | Retry and inspect report |
| SF-CONVERT-002 | Critical | Runtime | PPTX package generation failed. | Retry with smaller input |
| SF-PERF-001 | High | Performance | Conversion exceeded memory safety limit. | Reduce document size |
| SF-PERF-002 | Medium | Performance | Conversion exceeded target time budget. | Try Fast mode or simplify styles |
| SF-OFFLINE-001 | Medium | Offline | App resources not cached for offline use yet. | Open once online then retry offline |
| SF-SHARE-001 | Low | Share | Share upload canceled by user. | Retry when ready |

## 3. Handling Rules

- Every surfaced error must include code and plain-language guidance.
- Critical errors create blocking status and disable download.
- Medium/Low errors allow completion if output remains valid.
- All errors are logged in conversion report artifact.

## 4. QA Requirements

- Unit tests for error mapping and message generation.
- Integration tests for at least one fixture per High and Critical code path.
- No unresolved Critical defects allowed at release.
