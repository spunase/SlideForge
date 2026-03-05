# SlideForge UI Motion and Micro-Feedback Spec

## Objective
Create a minimal, premium UI that feels calm and precise while improving perceived speed and interaction confidence.

## Design Principles
- Quiet surfaces: low-contrast layered panels over a soft atmospheric background.
- Motion with purpose: every animation communicates status, affordance, or completion.
- Fast feel: interactions should read as responsive even during heavier conversion stages.
- Restraint: avoid flashy effects; use subtle depth, timing, and typography hierarchy.

## Tokens
### Color
- `--sf-bg-0`: `#090909`
- `--sf-bg-1`: `#0d0d0d`
- `--sf-bg-2`: `#121212`
- `--sf-panel`: `#101010`
- `--sf-panel-elevated`: `#171717`
- `--sf-border`: `#262626`
- `--sf-border-strong`: `#3b3b3b`
- `--sf-text`: `#f5f5f5`
- `--sf-text-muted`: `#9d9d9d`
- `--sf-accent`: `#e2b714`
- `--sf-success`: `#29c778`
- `--sf-danger`: `#ff5d5d`

### Motion
- `--sf-ease-standard`: `cubic-bezier(0.22, 1, 0.36, 1)`
- `--sf-dur-fast`: `140ms`
- `--sf-dur-mid`: `220ms`
- `--sf-dur-slow`: `320ms`

### Elevation
- `--sf-shadow-soft`: `0 10px 28px rgba(0, 0, 0, 0.28)`
- `--sf-shadow-accent`: `0 10px 30px rgba(226, 183, 20, 0.16)`

## Component Interaction Spec
### App Shell and Background
- Add soft radial glows and film-grain texture with slow drift.
- Keep contrast low enough to avoid visual noise behind content.
- Ensure no large repaint-heavy animations.

### DropZone
- Intent states:
- `neutral`: dashed border, muted icon/text.
- `ready`: accent border and subtle inner glow when draggable files are valid.
- `invalid`: danger tint and clear corrective message.
- Magnetic affordance:
- Slight scale/lift and border brightening on hover/drag-over.
- Use drag depth counting to prevent flicker on nested drag events.

### Progress
- Add stage chips for pipeline narrative:
- `Ingest`, `Render`, `Extract`, `Analyze`, `Build`, `Package`, `Report`.
- Highlight active stage and mark completed stages with success styling.
- Keep numeric progress visible for trust and predictability.

### Preview Grid
- While converting and before real previews render, show skeleton cards with shimmer.
- Preserve final card dimensions to avoid layout shift.

### Success Moment
- On conversion complete, reveal a compact success badge with quick bloom.
- Download CTA enters with a short rise/fade animation.
- Keep effect under 400ms total.

## Accessibility and Performance Rules
- Respect `prefers-reduced-motion: reduce` and disable non-essential animation.
- Animate only `opacity` and `transform` for most transitions.
- Preserve keyboard focus visibility and ARIA semantics.
- Maintain touch-friendly hit targets and responsive layout behavior.

## Implementation Checklist
- [x] Add global design and motion tokens in demo CSS.
- [x] Add atmospheric background and subtle texture treatment.
- [x] Add DropZone intent-aware drag feedback and magnetic hover behavior.
- [x] Add staged progress chips mapped from pipeline stage labels.
- [x] Add preview skeleton cards while conversion previews are pending.
- [x] Add success reveal animation for post-conversion download state.
- [x] Keep reduced-motion handling and responsive behavior intact.

