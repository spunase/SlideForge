# UI and UX Design

Last Updated: 2026-03-04

## 1. Design Principles

- Minimal and focused: one primary task per screen.
- Fast perception: show useful progress immediately.
- Trust and clarity: users always know what data stays local and what failed.
- Accessible by default: keyboard and screen reader support.

## 2. Visual System

### Color Palette
- Background: `#0D0D0D`
- Foreground: `#FFFFFF`
- Accent: `#E2B714`
- Secondary text: `#AAAAAA`
- Error: `#FF4D4D`
- Success: `#23C16B`

### Typography
- Primary: `Inter`
- Monospace: `Fira Code`
- Use clear hierarchy for status and action labels.

### Layout
- Single centered workspace card on desktop.
- Stacked flow on mobile.
- Generous spacing and high contrast controls.

## 3. Interaction Requirements

### Upload
- Drag-and-drop zone with focus and hover states.
- Keyboard-triggerable file selection button.
- Immediate validation feedback.

### Progress
- Stage-based progress indicator with labels: `parse`, `analyze`, `map`, `package`.
- Estimated time text for long conversions (>2 seconds).
- Cancel action always visible while converting.

### Preview
- First thumbnail must appear as soon as available.
- Remaining thumbnails stream in order.
- Thumbnail panel virtualizes when slide count is large.

### Download
- Download button appears only when output is ready.
- Conversion report summary is visible before download.
- Start-over action clears state and keeps app responsive.

## 4. Accessibility Requirements

- Full keyboard operation for all critical actions.
- Focus indicators with at least 3:1 contrast to background.
- Live region for conversion status updates and errors.
- Form controls include accessible names and helper text.
- Color is never the only error signal.

## 5. Performance Perception Guidelines

- Show first meaningful UI feedback within 150 ms after upload.
- Avoid blocking interactions during conversion.
- Use subtle motion only where it conveys state change.
- Avoid heavy visual effects on large lists and preview grids.

## 6. Content and Messaging

- Use clear, non-technical copy in errors and warnings.
- Map UI errors to codes in `docs/error-taxonomy.md`.
- Explicitly label optional network-dependent features as opt-in.

## 7. Responsive Behavior

- Desktop: split pane for preview and controls.
- Tablet/mobile: stacked sections with sticky action bar.
- Minimum supported viewport width: 320 px.
