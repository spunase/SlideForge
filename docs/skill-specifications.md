# Skill Specifications for Claude Code

## Skill 1: `html2pptx-core`

### Purpose
Convert an HTML string (with assets) into a PPTX Blob with pixel‑perfect fidelity.

### Input
- `html`: string – the HTML content.
- `assets`: `Map<string, Blob>` – mapping of asset URLs (images, fonts, external CSS) to their data.
- `options`: `{ slideWidth: number, slideHeight: number }` (in pixels). Default 1920×1080.

### Output
`Promise<Blob>` – the PPTX file.

### Behaviour
1. Create a hidden iframe, write the HTML + assets, wait for load.
2. For each element, call `getBoundingClientRect()` and `getComputedStyle()`.
3. Collect all text nodes, images, and block elements.
4. Map styles to PowerPoint:
   - `color` → text colour (RGB)
   - `font-family` → font name (embed if custom)
   - `font-size` → size in points
   - `background` (gradient) → gradient fill
   - `box-shadow` → shadow effect
   - `border-radius` → rounded rectangle
   - etc.
5. Build PPTX structure using `jszip`:
   - `[Content_Types].xml`
   - `_rels/.rels`
   - `ppt/slides/slide1.xml` (and more for multiple slides)
   - `ppt/styles.xml`, `ppt/presentation.xml`, etc.
6. Embed fonts as `ppt/fonts/*.ttf` if allowed.
7. Return Blob.

### Testing
- Unit tests for each style mapping.
- Visual regression tests comparing screenshots of PPTX vs original HTML.
- Edge cases: very large HTML, missing assets, unsupported CSS.

---

## Skill 2: `slideforge-ui`

### Purpose
React components implementing the minimal UI.

### Components

#### `DropZone`
- Accepts drag‑and‑drop and click‑to‑select.
- Handles single `.html` files and folders (via `webkitdirectory` or zip).
- Emits `onUpload(files: Map<string, Blob>)`.

#### `PreviewGrid`
- Receives an array of slide preview images (base64) and displays them in a scrollable grid.
- Thumbnail click opens larger preview.

#### `OptionsBar`
- Dropdown for slide size (16:9, 4:3, A4, custom).
- “Generate PPTX” button.
- Shows progress bar during conversion.

#### `DownloadButton`
- Appears when PPTX is ready.
- Provides download link and “Start over” option.

#### `App`
- Orchestrates state using Zustand.
- Calls core skill when “Generate” is clicked.

### Styling
- TailwindCSS with custom theme (dark background, yellow accent).
- Responsive: works on mobile (simplified layout).

### State (Zustand)
```typescript
interface Store {
  files: Map<string, Blob>;
  slides: { preview: string; data: any }[];
  status: 'idle' | 'parsing' | 'converting' | 'done';
  progress: number;
  downloadUrl: string | null;
  slideSize: { width: number; height: number };
  setFiles: (files: Map<string, Blob>) => void;
  setSlides: (slides: any[]) => void;
  setStatus: (status: Store['status']) => void;
  setProgress: (progress: number) => void;
  setDownloadUrl: (url: string) => void;
  setSlideSize: (size: { width: number; height: number }) => void;
}