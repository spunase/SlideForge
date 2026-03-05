# Requirements

Last Updated: 2026-03-04

## 1. Product Scope

SlideForge converts HTML documents into editable PowerPoint files (`.pptx`) fully client-side by default.

### Core Promise
- Fast conversion for common document sizes.
- High visual fidelity for supported CSS features.
- Editable text and shapes in PowerPoint.
- No automatic server upload of user HTML or assets.

## 2. Primary User Stories

1. As a user, I can upload an HTML file or a zip/folder of related assets and immediately see previews.
2. As a user, I can choose standard or custom slide dimensions before conversion.
3. As a user, I can download a valid `.pptx` that opens in Microsoft PowerPoint without repair prompts.
4. As a user, I can edit text and key shapes in PowerPoint after conversion.
5. As a user, I can run conversion offline after first app load.
6. As a user, I can see warnings for unsupported styles or missing assets.

## 3. Functional Requirements

### 3.1 Input and Asset Handling
- Accept `.html` and `.htm` files.
- Accept zip bundles containing HTML, CSS, fonts, and images.
- Support folder upload where browser APIs allow it.
- Resolve relative asset paths against uploaded bundle structure.
- Reject unsupported file types with actionable error messages.

### 3.2 Parsing and Slide Segmentation
- Parse inline and linked CSS.
- Parse HTML into slide candidates using this order:
1. Elements with `data-slide`.
2. Elements with class `slide`.
3. Top-level `<section>` elements.
4. Fallback: single-slide render if no markers are found.
- Provide user warning when fallback segmentation is used.

### 3.3 Conversion and Output
- Map supported CSS to PowerPoint DrawingML based on the CSS support matrix.
- Preserve text as editable text objects for all Tier A and Tier B supported scenarios.
- Embed fonts only when licensing and browser access permit; otherwise use deterministic fallback mapping.
- Generate a valid PPTX package with correct relationships and content types.
- File name default: original HTML file stem plus `.pptx`.

### 3.4 Preview and UX
- Display first preview thumbnail as soon as first slide render is available.
- Stream remaining previews progressively.
- Show stage-based progress (`parse`, `analyze`, `map`, `package`).
- Allow conversion cancellation.

### 3.5 Fallbacks and Reporting
- Apply fallback priorities when exact conversion is not possible:
1. Preserve editability of text.
2. Preserve layout geometry.
3. Preserve decorative effects.
- Produce a conversion report listing warnings, unsupported styles, and substitutions.

### 3.6 Privacy and Networking
- Default mode: local-only processing, no automatic upload of user content.
- Optional features that require network use must be explicit opt-in.
- Optional share features must never upload raw HTML by default.

## 4. Non-Functional Requirements

### 4.1 Performance SLOs
Reference benchmark environment: laptop with 4 physical cores, 16 GB RAM, SSD, latest stable Chrome.

| Metric | Target |
|---|---|
| First thumbnail after upload (<=500 elements) | p95 <= 1.5 seconds |
| Full conversion (10 slides, <=2000 elements total) | p95 <= 5.0 seconds |
| Main-thread long tasks during conversion | <=2 tasks over 50 ms |
| Peak memory during conversion | <=600 MB |
| Output size for reference fixture set | <=20 MB |

### 4.2 Output Quality
- Visual similarity on supported fixtures: SSIM >= 0.97.
- Text/shape position drift on supported fixtures: <=2 px median drift.
- 100% editable text for Tier A and Tier B supported scenarios.

### 4.3 Reliability
- No crash on malformed HTML/CSS; return recoverable error state.
- Deterministic output for identical input and options.
- Offline use supported after first load through service worker caching.

### 4.4 Accessibility
- Conform to WCAG 2.1 AA for app UI.
- Full keyboard flow for upload, options, conversion, and download.
- Screen-reader labels and live-region status updates for conversion progress and errors.

### 4.5 Compatibility
- Supported browsers: latest two versions of Chrome, Edge, Firefox, Safari.
- Required support targets are validated by release smoke tests.

## 5. Constraints

- No mandatory server dependency for core conversion flow.
- Use only browser-compatible technologies for core conversion in production path.
- Unsupported CSS must fail gracefully with explicit reporting.

## 6. Supporting Specifications

- `docs/performance-budget.md`
- `docs/output-quality-rubric.md`
- `docs/css-support-matrix.md`
- `docs/error-taxonomy.md`
- `docs/benchmark-fixtures.md`
