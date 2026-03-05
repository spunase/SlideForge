# Acceptance Criteria

Last Updated: 2026-03-04

## 1. Test Environment Baseline

- Reference hardware: 4 physical cores, 16 GB RAM, SSD.
- Baseline browser for performance criteria: latest stable Chrome.
- Cross-browser smoke: latest Chrome, Edge, Firefox, Safari.

## 2. Upload and Validation

- [ ] User can upload `.html` or `.htm` by click selection.
- [ ] User can upload `.html` or `.htm` by drag and drop.
- [ ] User can upload a zip bundle and conversion resolves relative paths correctly.
- [ ] Unsupported file types show an error from `docs/error-taxonomy.md`.
- [ ] Selected file name and size are shown in UI.

## 3. Preview Performance

- [ ] For fixture `basic-single-slide-500`, first thumbnail appears in <=1.5 seconds at p95.
- [ ] Preview generation is progressive: first thumbnail appears before full thumbnail set is complete.
- [ ] Up to first 6 thumbnails are visible without layout shift greater than 0.1 CLS during generation.

## 4. Slide Options

- [ ] Dropdown contains `16:9`, `4:3`, `A4`, and `Custom`.
- [ ] Custom width/height accepts pixel values and validates range.
- [ ] Output PPTX slide dimensions match selected option within 1 px converted equivalent.

## 5. Conversion Speed and Stability

- [ ] For fixture class `typical-10-slides-2000-elements`, total conversion time is <=5.0 seconds at p95.
- [ ] Main-thread long tasks over 50 ms are <=2 during conversion.
- [ ] Peak memory stays <=600 MB in baseline benchmark runs.
- [ ] Cancellation stops conversion and returns UI to recoverable state within 500 ms.

## 6. Output Quality and Editability

- [ ] Supported fixture set meets SSIM >=0.97 against baseline render.
- [ ] Supported fixture set meets median text/shape drift <=2 px.
- [ ] 100% text nodes remain editable for Tier A and Tier B CSS support cases.
- [ ] No unsupported style silently fails; conversion report lists each unsupported rule.

## 7. Segmentation Rules

- [ ] `data-slide` elements map to one slide each.
- [ ] If `data-slide` absent, `.slide` class elements map to slides.
- [ ] If `.slide` absent, top-level `<section>` elements map to slides.
- [ ] If no markers exist, one slide is produced and report includes fallback warning.

## 8. Assets and Fonts

- [ ] Linked CSS and images from uploaded bundle resolve with no network requirement.
- [ ] Font embedding occurs only when file is available and allowed.
- [ ] Font fallback uses deterministic mapping defined in `docs/css-support-matrix.md`.
- [ ] Conversion report records every font substitution.

## 9. Privacy and Offline

- [ ] Default conversion flow sends no user HTML/assets to external servers.
- [ ] Optional sharing is opt-in and requires explicit user action.
- [ ] App runs offline after first load for core conversion path.

## 10. Accessibility

- [ ] Keyboard-only flow can upload, configure, convert, and download.
- [ ] Live region announces conversion progress stage changes.
- [ ] Color contrast for text and controls meets WCAG 2.1 AA.
- [ ] Axe critical violations count is zero in CI accessibility smoke tests.

## 11. Cross-Browser Compatibility

- [ ] Core flow passes smoke test on Chrome and Edge.
- [ ] Core flow passes smoke test on Firefox and Safari.
- [ ] Any browser-specific degradation is documented in release notes.

## 12. Release Gates

- [ ] All CI gates in `docs/testing-strategy.md` pass.
- [ ] No unresolved Critical severity defects from `docs/error-taxonomy.md`.
- [ ] Conversion report format is stable and included in release test artifacts.
