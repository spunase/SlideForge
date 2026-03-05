# SlideForge

Convert any HTML document into a pixel-perfect, editable PowerPoint presentation — 100% client-side, zero data leaves the browser. Built with React + TypeScript, Vite, TailwindCSS, and Zustand.

## Commands

```
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build locally
npm run test         # Run all Jest tests
npm run test:unit    # Unit tests only
npm run test:e2e     # Puppeteer integration tests
npm run lint         # ESLint check
npm run typecheck    # TypeScript strict check
```

## Architecture

```
/packages/core       - html2pptx-core: conversion engine (HTML → PPTX)
/packages/ui         - slideforge-ui: React component library
/apps/demo           - Demo application / landing page
/docs                - Project specifications and design docs
```

### Documentation (docs/)

Reference these when implementing features:

- `docs/architecture.md` — tech stack, conversion pipeline, skill definitions
- `docs/skill-specifications.md` — detailed I/O specs for core and UI skills
- `docs/ui-design.md` — color palette, typography, layout, interactions
- `docs/acceptance-criteria.md` — checkable criteria for every feature
- `docs/testing-strategy.md` — unit, integration, visual regression, and perf tests
- `docs/requirements.md` — user stories, functional and non-functional requirements
- `docs/development-phases.md` — MVP → Viral Features → Polish phasing
- `docs/growth-strategy.md` — viral/social/launch strategy
- `docs/delivery.md` — repo structure and delivery expectations
- `docs/project-overview.md` — README-style project summary

### packages/core

The conversion engine. Takes an HTML string + asset map + slide dimensions → returns a PPTX Blob. Key internals:

- `DOMParser` for HTML parsing
- `css-tree` for CSS parsing (font faces, linked stylesheets)
- `opentype.js` for font subsetting and embedding
- `jszip` for PPTX assembly (OOXML zip structure)
- Browser File API for asset handling

### packages/ui

React components for the minimal UI:

- `DropZone` — file/folder upload via drag-and-drop or click
- `PreviewGrid` — thumbnail slide preview
- `OptionsBar` — slide size selector (16:9, 4:3, A4, custom)
- `DownloadButton` — single-click PPTX download

State managed with Zustand. Styled with TailwindCSS.

## Code Conventions

- TypeScript strict mode. No `any` types — use `unknown` and narrow.
- Named exports only, no default exports.
- One React component per file. Filename matches component name (PascalCase).
- Prefer `function` declarations for components over arrow functions.
- Use path aliases: `@core/*`, `@ui/*` mapped in tsconfig.
- CSS: use Tailwind utility classes. Custom CSS only when Tailwind cannot express it.
- Tests live next to source files: `Foo.test.ts` beside `Foo.ts`.

## Design System

- Background: `#0D0D0D`, Foreground: `#FFFFFF`, Accent: `#E2B714`
- Secondary text: `#AAAAAA`, Error: `#FF4D4D`
- Font: Inter (UI), Fira Code (monospace/code)
- Inspiration: Monkeytype, Linear, Stripe — minimal, dark, fast

## Things That Will Bite You

- PPTX is a zip of XML files (OOXML). Slide coordinates are in EMUs (English Metric Units): 1 inch = 914400 EMU. Always convert CSS px → EMU.
- CSS `box-shadow` has no direct PowerPoint equivalent — approximate with `<a:outerShdw>`.
- Font embedding requires subsetting via opentype.js. Never embed full font files — PPTX size will explode.
- `<section>` elements in the input HTML each become a separate slide. Document this for users.
- All processing is client-side. Never add server calls, analytics scripts, or external requests that send user data.
- jszip operates async — all PPTX assembly functions must be async/await.

## Debug Lessons — Pipeline Gotchas

These are hard-won lessons from debugging the conversion pipeline. Read before modifying pipeline stages.

### jsdom CSS Cascade Does NOT Work

**Problem**: jsdom's `getComputedStyle()` does NOT resolve class-based styles from `<style>` blocks — only inline `style=""` attributes are reflected. This is a documented limitation (jsdom issues #2986, #2363, #274).

**Consequence**: In test/Node mode, any CSS applied via classes (`.card { background: white }`) is invisible to the extract stage. Elements appear unstyled — no fills, no shadows, no borders.

**Solution**: `render.ts` has `applyStylesToInline()` — a manual CSS-to-inline resolver that parses `<style>` blocks, matches selectors against elements, resolves `var()` references, and stamps computed values as inline `style` attributes before the extract stage runs.

**Rule**: When adding new CSS property support, verify it works in BOTH browser mode (iframe + getComputedStyle) AND jsdom mode (inline style resolver). Run the dashboard integration test to confirm.

### CSS Custom Properties (`var()`) Don't Work in jsdom

**Problem**: cssstyle (jsdom's CSS engine) strips `var()` expressions as invalid values (cssstyle#89, jsdom#1895). Any CSS using custom properties resolves to empty strings.

**Solution**: `render.ts` has `resolveVarReferences()` that recursively resolves `var(--name, fallback)` patterns from `:root` declarations. Supports nested vars up to 10 levels deep.

**Rule**: If a fixture uses CSS custom properties, the CSS must be in the assets map so `inlineLinkedStylesheets()` can inline it and `applyStylesToInline()` can resolve the vars.

### New CSS Properties Must Flow Through ALL Pipeline Stages

When adding support for a new CSS property (e.g., `text-align`), it must be wired through every stage:

1. **extract.ts** — Add to `TRACKED_STYLE_PROPERTIES` array so `pickTrackedStyles()` captures it
2. **analyze.ts / PropertyMapper** — Map the raw CSS value to the typed `MappedShape` field
3. **build.ts** — Convert the `MappedShape` field to the `SlideShape` / OOXML equivalent
4. **SlideBuilder.ts** — Emit the correct DrawingML XML element

Missing ANY stage silently drops the property. The `textAlign` bug was caused by step 3-4 being skipped — it was parsed and mapped correctly but never emitted as `<a:pPr algn="..."/>` in the XML.

### Geometry Estimation in jsdom Requires Layout Awareness

**Problem**: In jsdom/DOMParser mode, `getBoundingClientRect()` returns zeros. The fallback `estimateGeometry()` must infer positions from CSS properties stamped as inline styles.

**Key behaviors**:
- Detects `display: flex/grid` to distribute children horizontally vs vertically
- Parses `grid-template-columns` (e.g., `2fr 1fr`) into proportional width ratios
- Respects `max-width` with `margin: 0 auto` centering
- Accounts for `padding` and `gap` in child slot computation
- Only `px` units are matched — `%`, `em`, `rem`, `vw` are not supported

**Rule**: When testing new HTML fixtures in jsdom, verify geometry is reasonable (elements from different columns should have different `x` values, not all `x=0, w=slideWidth`).

### External CSS Must Be in the Assets Map

**Problem**: When only HTML is uploaded, external `<link rel="stylesheet">` CSS files are not available. The pipeline silently produces unstyled output.

**Solution**: `inlineLinkedStylesheets()` in `render.ts` checks:
1. The uploaded assets map (normalized key matching)
2. A fetch from the server (relative URLs only, browser mode)

**Rule**: Integration tests MUST include CSS files in the assets map:
```typescript
assets.set('styles.css', new Blob([css], { type: 'text/css' }));
```

### OOXML Text Alignment Is Paragraph-Level

Text alignment in OOXML is set on `<a:pPr algn="..."/>` inside `<a:p>`, NOT on run properties `<a:rPr>`. The mapping:

| CSS `text-align` | OOXML `algn` |
|-------------------|-------------|
| `left`            | `l`         |
| `center`          | `ctr`       |
| `right`           | `r`         |
| `justify`         | `just`      |

### Stale `dist/` Artifacts Cause TS6305 Errors

After editing files across packages, stale `.d.ts` files in `packages/core/dist` and `packages/ui/dist` can cause "Output file has not been built from source" errors. Fix:
```bash
npx tsc --build --clean && rm -rf packages/core/dist packages/ui/dist && npx tsc --build
```

## Key Workflows

### Adding a new CSS → PPTX mapping

1. Add the CSS property parser in `packages/core/src/styles/`
2. Add the OOXML builder in `packages/core/src/builders/`
3. Write a unit test with sample HTML that uses the property
4. Add a visual regression test case in the test fixtures

### Adding a new UI component

1. Create the component file in `packages/ui/src/components/`
2. Use Tailwind classes. Follow the design system colors above.
3. Wire state through the Zustand store in `packages/ui/src/store/`
4. Keep components pure — side effects live in the store or hooks.

## Non-Functional Requirements

- Conversion must complete in < 5 seconds for typical HTML (≤ 2000 elements)
- WCAG 2.1 AA accessibility (keyboard nav, screen reader labels, contrast ratios)
- Browser support: Chrome, Firefox, Safari, Edge (latest 2 versions)
- PWA-capable: works offline after first load (Phase 3)
