import { useCallback, useRef, useState } from 'react';
import type { MappedShape } from '@core/types';
import { SlidePreviewRenderer } from './SlidePreviewRenderer';

interface ComparisonSliderProps {
  sourceHtml: string;
  shapes: MappedShape[];
  slideWidth: number;
  slideHeight: number;
  width: number;
  height: number;
}

export function ComparisonSlider({
  sourceHtml,
  shapes,
  slideWidth,
  slideHeight,
  width,
  height,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setIsDragging(true);
      updatePosition(e.clientX);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    },
    [isDragging, updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard support: left/right arrows adjust the slider
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 2));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 2));
    }
  }, []);

  // Build a sandboxed srcdoc for the "before" HTML iframe
  const iframeSrcDoc = buildSandboxedHtml(sourceHtml, slideWidth, slideHeight);

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-[18px]"
      style={{ width: `${width}px`, height: `${height}px` }}
      data-testid="comparison-slider"
    >
      {/* Before layer: Original HTML in sandboxed iframe */}
      <div
        className="absolute inset-0"
        aria-label="Original HTML preview"
      >
        <iframe
          srcDoc={iframeSrcDoc}
          title="Original HTML"
          className="h-full w-full border-0"
          sandbox="allow-same-origin"
          data-testid="comparison-before"
          style={{ pointerEvents: 'none' }}
        />
        {/* "Before" label */}
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          HTML
        </div>
      </div>

      {/* After layer: PPTX preview, clipped from the right */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        aria-label="PPTX preview"
      >
        <div className="h-full w-full bg-white">
          <SlidePreviewRenderer
            shapes={shapes}
            slideWidth={slideWidth}
            slideHeight={slideHeight}
            className="h-full w-full"
          />
        </div>
        {/* "After" label */}
        <div className="absolute right-3 top-3 rounded-full bg-[var(--sf-accent)]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black backdrop-blur-sm">
          PPTX
        </div>
      </div>

      {/* Drag handle */}
      <div
        className="absolute top-0 z-10"
        style={{
          left: `${position}%`,
          height: '100%',
          transform: 'translateX(-50%)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        role="slider"
        aria-label="Comparison slider"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        data-testid="comparison-handle"
      >
        {/* Vertical line */}
        <div className="absolute left-1/2 h-full w-[2px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)]" />

        {/* Grip circle */}
        <div
          className={[
            'absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/70 shadow-lg backdrop-blur-sm transition-transform',
            isDragging ? 'scale-110' : 'hover:scale-105',
          ].join(' ')}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <svg
            className="h-4 w-4 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M8 6l-4 6 4 6" />
            <path strokeLinecap="round" d="M16 6l4 6-4 6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Build a self-contained HTML document for the iframe.
 * Strips <script> tags for security, scales content to fit the viewport.
 */
function buildSandboxedHtml(
  html: string,
  _slideWidth: number,
  _slideHeight: number,
): string {
  // Strip script tags for security
  const sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  // If it's a full HTML document, inject viewport scaling
  if (sanitized.includes('<html') || sanitized.includes('<!DOCTYPE') || sanitized.includes('<!doctype')) {
    // Inject a viewport meta and zoom transform into the <head>
    const scaleStyle = `
      <style data-comparison-scale>
        html {
          overflow: hidden;
          transform-origin: top left;
        }
      </style>
    `;

    // Insert before </head> if it exists, otherwise prepend
    if (sanitized.includes('</head>')) {
      return sanitized.replace('</head>', `${scaleStyle}</head>`);
    }
    return `${scaleStyle}${sanitized}`;
  }

  // Fragment — wrap in a full document
  return `<!doctype html><html><head>
    <meta charset="utf-8"/>
    <style>html, body { margin: 0; padding: 0; overflow: hidden; }</style>
  </head><body>${sanitized}</body></html>`;
}
