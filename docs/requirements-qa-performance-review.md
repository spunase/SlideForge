# SlideForge Requirements and QA Review

Date: 2026-03-04
Scope: Documentation review focused on performance speed and output quality.

## 1. Executive Summary

SlideForge has a strong product vision, but the current requirements are not precise enough to guarantee fast, consistent, high-fidelity output. Most risks are specification risks, not implementation risks yet.

Top priorities:
1. Replace broad goals ("pixel-perfect", "<5s") with measurable quality and performance SLOs.
2. Resolve requirement conflicts (100% client-side privacy vs shareable URLs and optional network font fetches).
3. Add a CSS support matrix and explicit fallback behavior so quality is predictable.
4. Define benchmark protocol (hardware/browser/input classes) to make speed claims testable.
5. Strengthen acceptance criteria with quantitative pass/fail thresholds and release gates.

## 2. Documents Reviewed

- docs/requirements.md
- docs/acceptance-criteria.md
- docs/architecture.md
- docs/testing-strategy.md
- docs/ui-design.md
- docs/skill-specifications.md
- docs/development-phases.md
- docs/project-overview.md
- docs/delivery.md
- docs/growth-strategy.md
- CLAUDE.md

## 3. Findings (Ranked)

### Critical

1. Requirement conflict: privacy model is inconsistent.
- "No server-side processing" and "no data leaves browser" conflict with shareable URLs and optional external font requests.
- Impact: legal/privacy ambiguity, architecture churn, user trust risk.

2. Fidelity goal is unbounded.
- "Preserve all styling" plus editable output is not realistic for the full CSS surface.
- Impact: impossible acceptance scope, repeated regressions, unclear done criteria.

3. Performance target is under-specified.
- "<5 seconds for typical pages (2000 elements)" has no test device, browser, memory budget, or percentile target.
- Impact: teams can pass locally but fail in production.

4. Acceptance criteria are mostly qualitative.
- Many items are binary but non-measurable ("visually matches", "smooth animations", "no clutter").
- Impact: weak QA signal and subjective release decisions.

### High

5. CSS support boundaries are missing.
- No supported/partial/unsupported list for CSS properties and complex layout patterns.
- Impact: unpredictable output quality and support burden.

6. Font behavior is under-defined.
- No deterministic fallback map, licensing policy, or timeout behavior for unresolved fonts.
- Impact: text reflow drift and editability inconsistency.

7. Multi-slide detection rules are too narrow.
- Only section/class hooks are defined; no fallback pagination rules for long single-page documents.
- Impact: unusable slides for many real inputs.

8. Offline and PWA requirements lack operational detail.
- No cache versioning strategy, storage budget, or stale-asset behavior.
- Impact: reliability regressions and hard-to-debug failures.

### Medium

9. Test strategy lacks hard quality gates.
- Good test categories exist, but no blocking thresholds for visual diff, performance drift, or flaky test policy.
- Impact: quality erosion over time.

10. Encoding hygiene issue in docs.
- Multiple files contain mojibake artifacts (for example: "â€", "Ã—").
- Impact: ambiguity and unprofessional output in generated docs/UI copy.

## 4. Recommended Requirement Upgrades

## 4.1 Performance SLOs (Proposed)

Use explicit percentiles, hardware profile, and input classes.

| Metric | Target | Notes |
|---|---:|---|
| Time to first preview (1 slide, <=500 elements) | p95 <= 1.5s | From file selection to first thumbnail visible |
| Full conversion (10 slides, <=2000 elements total) | p95 <= 5.0s | Includes parsing, mapping, and PPTX packaging |
| Main-thread long tasks during conversion | <= 2 tasks >50ms | Worker offload required for heavy phases |
| Peak memory during conversion | <= 600 MB on reference device | Abort gracefully beyond hard cap |
| Output file size | <= 20 MB for reference fixture set | Warn user when estimate exceeds target |

Reference benchmark environment:
- Laptop profile: 4 physical cores, 16 GB RAM, SSD.
- Browser: latest stable Chrome and Edge for baseline, Firefox/Safari compatibility runs.
- Network: offline mode for core conversion tests.

## 4.2 Output Quality Definition (Proposed)

Define quality as four measurable dimensions:

1. Visual fidelity
- SSIM >= 0.97 against baseline render for supported fixtures.
- Element bounding-box drift <= 2 px for text and key shapes.

2. Editability
- 100% text nodes in supported fixtures remain editable in PowerPoint.
- No text flattened to bitmap unless feature is explicitly unsupported and logged.

3. Typographic fidelity
- Font family exact match when embeddable and licensed.
- When substituted, fallback must come from a predefined mapping table and remain within line-wrap tolerance.

4. Structural fidelity
- Lists, tables, and reading order preserved for supported patterns.

## 4.3 CSS Support Policy

Add a support matrix with three tiers:
- Tier A (fully supported): required for GA.
- Tier B (supported with approximation): allowed with quality note.
- Tier C (unsupported): must emit user-visible warning and fallback strategy.

Minimum required matrix areas:
- Typography, spacing, borders, shadows, gradients, transforms, filters, flex/grid, positioned elements, SVG handling.

## 4.4 Deterministic Fallback Rules

Define explicit behavior when conversion cannot be exact:
1. Preserve editability first for text.
2. Preserve layout second.
3. Preserve decorative styling third.
4. Emit conversion report with warnings and impacted selectors/elements.

## 4.5 UX Requirements for Speed Perception

Add requirements that improve perceived performance:
- Progressive preview rendering (show first slide ASAP, then stream remaining thumbnails).
- Conversion progress split by stages (parse, analyze, map, package).
- Non-blocking UI with cancellation support.
- "Fast / Balanced / Fidelity" mode selection with clear tradeoffs.

## 4.6 Accessibility and Reliability Clarifications

- Keyboard-only path for upload, preview selection, conversion, download.
- ARIA labels for all controls and status regions.
- Error taxonomy with actionable messages (invalid HTML, missing assets, font license block, memory cap exceeded).

## 5. QA Plan Upgrade

Adopt release gates that block merges/releases:

| Gate | Threshold | Enforcement |
|---|---|---|
| Unit tests | >= 90% statements on core mapping modules | CI required |
| Visual regression | <= 3% pixels beyond tolerance on reference fixtures | CI required |
| Performance regression | <= 10% slowdown vs baseline median | CI required |
| Cross-browser smoke | Chrome, Edge, Firefox, Safari pass core flow | Release required |
| Accessibility smoke | Keyboard flow + axe critical issues = 0 | CI required |

Required fixture suites:
- Basic layout fixture set.
- Advanced CSS fixture set.
- Large-document stress fixtures.
- Asset and font edge-case fixtures.

## 6. Architecture and Design Directives

1. Move heavy conversion phases to Web Worker and keep main thread for interaction.
2. Batch style reads to reduce layout thrashing from repeated `getComputedStyle` calls.
3. Add incremental conversion pipeline so slides can finish and preview independently.
4. Introduce caching for parsed CSS and asset hashing across repeated conversions.
5. Virtualize thumbnail grid beyond first visible set to prevent UI slowdown.
6. Add conversion telemetry hook (local only by default) for stage timing diagnostics.

## 7. Proposed Edits to Existing Markdown Files

| File | Proposed update |
|---|---|
| docs/requirements.md | Replace broad NFRs with measurable SLOs, add memory/output-size limits, define fallback priority order |
| docs/acceptance-criteria.md | Convert qualitative checks into quantitative pass/fail checks, add conversion report requirements |
| docs/testing-strategy.md | Add CI gates, fixture catalog, performance baseline protocol, flake policy |
| docs/architecture.md | Add worker pipeline, incremental rendering, cache strategy, telemetry boundaries |
| docs/ui-design.md | Add perceived-performance patterns, accessibility interaction requirements |
| docs/development-phases.md | Add explicit quality gates per phase and phase exit criteria |
| docs/growth-strategy.md | Reconcile with privacy model (opt-in share flow, no raw HTML upload defaults) |
| docs/project-overview.md | Remove marketing absolutes or qualify them with supported-scope statement |

## 8. Recommended New Markdown Files

1. docs/performance-budget.md
- Stage budgets, memory caps, output-size budgets, benchmark environments.

2. docs/output-quality-rubric.md
- Visual/editability/typography/structure scoring model and acceptance thresholds.

3. docs/css-support-matrix.md
- Tiered support table and fallback mapping per property/pattern.

4. docs/error-taxonomy.md
- Error codes, user messages, remediation steps.

5. docs/benchmark-fixtures.md
- Canonical fixture inventory and expected outcomes.

## 9. Immediate Next Step (After Your Approval)

Execute a requirements hardening pass across existing docs in this order:
1. requirements.md
2. acceptance-criteria.md
3. testing-strategy.md
4. architecture.md
5. New docs listed in Section 8

This sequence will give the team stable performance and quality targets before implementation begins.
