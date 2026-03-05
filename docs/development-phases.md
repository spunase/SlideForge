# Development Phases

Last Updated: 2026-03-04

## Phase 1 - Core MVP (2 weeks)

### Scope
- Single HTML upload with inline CSS support.
- Single-slide and marker-based multi-slide segmentation.
- Basic mapping for text, images, backgrounds, borders.
- Downloadable PPTX and conversion report.

### Exit Gates
- Core flow passes upload -> preview -> convert -> download.
- `basic` fixture suite passes quality thresholds.
- p95 full conversion <=5.0 seconds for MVP fixture profile.
- No Critical defects open.

### Deliverable
- Internal demo build with benchmark report and known limits.

## Phase 2 - Fidelity and Asset Expansion (2 weeks)

### Scope
- External CSS and zipped asset bundle support.
- Font embedding and deterministic fallback map.
- Extended CSS support matrix Tier A and Tier B coverage.
- Improved warning/reporting UX.

### Exit Gates
- `advanced-css` fixture suite passes thresholds.
- 100% editable text for Tier A and Tier B fixtures.
- Cross-browser smoke passes on Chrome and Edge.
- Accessibility smoke has zero critical violations.

### Deliverable
- Public beta with documented support matrix and limits.

## Phase 3 - Performance and Reliability Polish (1 week)

### Scope
- Worker offload for heavy conversion stages.
- Progressive preview and cancellation hardening.
- PWA offline support for core conversion flow.
- Finalized benchmark and release reporting.

### Exit Gates
- p95 conversion and memory targets pass in baseline environment.
- Performance regression gate stable in CI.
- Cross-browser smoke passes on Chrome, Edge, Firefox, Safari.
- Release checklist from `docs/testing-strategy.md` is fully green.

### Deliverable
- Production release candidate with quality evidence package.

## Phase 4 - Optional Growth Features (post-GA)

### Scope
- Opt-in share flows.
- Showcase gallery and social workflows.
- Embeddable widget experimentation.

### Exit Gates
- Privacy review complete and approved.
- No raw HTML upload without explicit user consent.
- Growth features do not degrade core conversion SLOs.
