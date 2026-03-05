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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPosition((p) => Math.max(0, p - 2));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setPosition((p) => Math.min(100, p + 2));
    }
  }, []);

  const iframeSrcDoc = buildSandboxedHtml(sourceHtml, slideWidth, slideHeight);
  const iframeScale = Math.min(width / slideWidth, height / slideHeight);
  const iframeX = Math.max(0, (width - slideWidth * iframeScale) / 2);
  const iframeY = Math.max(0, (height - slideHeight * iframeScale) / 2);

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-[18px]"
      style={{ width: `${width}px`, height: `${height}px` }}
      data-testid="comparison-slider"
    >
      <div className="absolute inset-0 bg-white" aria-label="Original HTML preview">
        <iframe
          srcDoc={iframeSrcDoc}
          title="Original HTML"
          className="absolute border-0"
          sandbox="allow-same-origin"
          data-testid="comparison-before"
          style={{
            pointerEvents: 'none',
            left: `${iframeX}px`,
            top: `${iframeY}px`,
            width: `${slideWidth}px`,
            height: `${slideHeight}px`,
            transform: `scale(${iframeScale})`,
            transformOrigin: 'top left',
          }}
        />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
          HTML
        </div>
      </div>

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
        <div className="absolute right-3 top-3 rounded-full bg-[var(--sf-accent)]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-black backdrop-blur-sm">
          PPTX
        </div>
      </div>

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
        <div className="absolute left-1/2 h-full w-[2px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.4)]" />

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

function buildSandboxedHtml(
  html: string,
  slideWidth: number,
  slideHeight: number,
): string {
  const sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, '');

  const fitStyle = `
      <style data-comparison-fit>
        html, body {
          margin: 0;
          padding: 0;
          width: ${slideWidth}px;
          height: ${slideHeight}px;
          overflow: hidden;
          background: #ffffff;
        }
      </style>
    `;

  if (
    sanitized.includes('<html') ||
    sanitized.includes('<!DOCTYPE') ||
    sanitized.includes('<!doctype')
  ) {
    if (sanitized.includes('</head>')) {
      return sanitized.replace('</head>', `${fitStyle}</head>`);
    }
    return `${fitStyle}${sanitized}`;
  }

  return `<!doctype html><html><head>
    <meta charset="utf-8"/>
    ${fitStyle}
  </head><body>${sanitized}</body></html>`;
}
