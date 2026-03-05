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
