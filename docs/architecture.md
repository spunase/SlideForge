# Technical Architecture

Last Updated: 2026-03-04

## 1. Architecture Goals

- Keep core conversion local-first and privacy-preserving.
- Hit performance and quality SLOs consistently.
- Keep UI responsive during heavy conversion workloads.

## 2. Stack

- Frontend: React + TypeScript
- Build: Vite
- Styling: TailwindCSS
- State: Zustand
- Package assembly: JSZip
- CSS parsing: css-tree
- Font handling: opentype.js
- Conversion runtime: Web Worker + main-thread coordinator

## 3. High-Level System

### Main Thread Responsibilities
- File upload and validation.
- Hidden iframe render for style computation.
- Progressive thumbnail display.
- User controls, progress updates, cancellation.

### Worker Responsibilities
- Conversion graph building from extracted computed styles.
- CSS to DrawingML mapping.
- Slide XML generation and PPTX packaging.
- Conversion report generation.

## 4. Conversion Pipeline

1. `ingest`
- Validate files, normalize asset map, detect encoding.

2. `render`
- Render HTML in isolated iframe and wait for stable layout.

3. `extract`
- Collect computed style snapshots and geometry by slide segment.

4. `analyze`
- Map extracted styles to support tiers and select fallbacks.

5. `build`
- Build slide object graph and map to OOXML parts.

6. `package`
- Assemble PPTX zip and return Blob.

7. `report`
- Emit warnings, substitutions, unsupported rules, and timings.

## 5. Performance Architecture Decisions

- Heavy stages (`analyze`, `build`, `package`) execute in Worker.
- Stage-level timing instrumentation is required for all pipeline steps.
- Parsed CSS AST and asset hashes are cached for repeat runs in session.
- Preview rendering is progressive to reduce perceived latency.
- Thumbnail grid is virtualized beyond visible window.

## 6. Data Contracts

### Core Input
- `html: string`
- `assets: Map<string, Blob>`
- `options: { slideWidth: number; slideHeight: number; mode: 'fast' | 'balanced' | 'fidelity' }`

### Core Output
- `pptxBlob: Blob`
- `report: ConversionReport`
- `metrics: ConversionMetrics`

### ConversionReport (minimum)
- `warnings: Array<{ code: string; message: string; selector?: string }>`
- `fontSubstitutions: Array<{ requested: string; used: string }>`
- `unsupportedRules: Array<{ property: string; value: string; selector?: string }>`

## 7. Reliability and Failure Handling

- All stage failures map to documented error codes.
- Partial failures must return structured report and user-readable message.
- Cancellation is idempotent and leaves app in recoverable idle state.

## 8. Security and Privacy Boundaries

- Core conversion path does not transmit user document contents.
- Optional share/export features are isolated and explicit opt-in.
- No third-party analytics scripts may access raw document content.

## 9. Supporting Design Docs

- `docs/performance-budget.md`
- `docs/output-quality-rubric.md`
- `docs/css-support-matrix.md`
- `docs/error-taxonomy.md`
- `docs/benchmark-fixtures.md`
