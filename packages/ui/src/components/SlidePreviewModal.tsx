import { useCallback, useEffect, useMemo, useState } from 'react';
import { useConversionStore } from '../store';
import { SlidePreviewRenderer } from './SlidePreviewRenderer';
import { ComparisonSlider } from './ComparisonSlider';

interface ViewportSize {
  width: number;
  height: number;
}

function getViewportSize(): ViewportSize {
  if (typeof window === 'undefined') {
    return { width: 1440, height: 900 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function getFittedSlideSize(
  viewport: ViewportSize,
  slideWidth: number,
  slideHeight: number,
): { width: number; height: number; scalePct: number } {
  const horizontalPadding = viewport.width < 768 ? 32 : 96;
  const verticalChrome = viewport.height < 700 ? 170 : 220;

  const maxWidth = Math.max(300, viewport.width - horizontalPadding);
  const maxHeight = Math.max(220, viewport.height - verticalChrome);
  const aspectRatio = slideWidth / slideHeight;

  let width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
    scalePct: Math.round((width / slideWidth) * 100),
  };
}

export function SlidePreviewModal() {
  const selectedSlideIndex = useConversionStore((s) => s.selectedSlideIndex);
  const mappedSlides = useConversionStore((s) => s.mappedSlides);
  const slideSize = useConversionStore((s) => s.slideSize);
  const setSelectedSlideIndex = useConversionStore(
    (s) => s.setSelectedSlideIndex,
  );
  const sourceHtml = useConversionStore((s) => s.sourceHtml);
  const comparisonMode = useConversionStore((s) => s.comparisonMode);
  const setComparisonMode = useConversionStore((s) => s.setComparisonMode);

  const [viewportSize, setViewportSize] = useState<ViewportSize>(() => getViewportSize());

  const totalSlides = mappedSlides.length;

  const close = useCallback(() => {
    setSelectedSlideIndex(null);
  }, [setSelectedSlideIndex]);

  const goNext = useCallback(() => {
    if (selectedSlideIndex !== null && selectedSlideIndex < totalSlides - 1) {
      setSelectedSlideIndex(selectedSlideIndex + 1);
    }
  }, [selectedSlideIndex, totalSlides, setSelectedSlideIndex]);

  const goPrev = useCallback(() => {
    if (selectedSlideIndex !== null && selectedSlideIndex > 0) {
      setSelectedSlideIndex(selectedSlideIndex - 1);
    }
  }, [selectedSlideIndex, setSelectedSlideIndex]);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize(getViewportSize());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (selectedSlideIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedSlideIndex]);

  useEffect(() => {
    if (selectedSlideIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          close();
          break;
        case 'ArrowRight':
          goNext();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlideIndex, close, goNext, goPrev]);

  const fittedSize = useMemo(
    () => getFittedSlideSize(viewportSize, slideSize.width, slideSize.height),
    [viewportSize, slideSize.width, slideSize.height],
  );

  if (selectedSlideIndex === null) return null;

  const shapes = mappedSlides[selectedSlideIndex];
  if (!shapes) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Slide ${selectedSlideIndex + 1} of ${totalSlides} preview`}
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/78 backdrop-blur-md"
        onClick={close}
        aria-label="Close slide preview"
      />

      <div className="relative mx-auto flex h-full w-full max-w-[1880px] flex-col px-4 pb-4 pt-4 sm:px-8 sm:pb-7 sm:pt-6">
        <div className="mb-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-sm sm:px-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--sf-accent)]" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-white">
                Slide {selectedSlideIndex + 1}
              </p>
              <p className="text-[11px] text-[var(--sf-text-muted)]">
                {slideSize.width} x {slideSize.height} px
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {sourceHtml && (
              <button
                type="button"
                className={[
                  'cursor-pointer inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-150',
                  comparisonMode
                    ? 'border-[var(--sf-accent)]/50 bg-[var(--sf-accent)]/15 text-[var(--sf-accent)]'
                    : 'border-white/15 bg-white/5 text-[var(--sf-text-muted)] hover:bg-white/10 hover:text-white',
                ].join(' ')}
                onClick={() => setComparisonMode(!comparisonMode)}
                aria-label={comparisonMode ? 'Exit comparison mode' : 'Compare HTML vs PPTX'}
                aria-pressed={comparisonMode}
                data-testid="comparison-toggle"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" d="M12 3v18M3 12h18" />
                  <rect x="3" y="3" width="7" height="18" rx="1" strokeWidth={1.5} />
                  <rect x="14" y="3" width="7" height="18" rx="1" strokeWidth={1.5} />
                </svg>
                Compare
              </button>
            )}
            <div className="hidden text-xs text-[var(--sf-text-muted)] sm:block">
              Use <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Esc</kbd> to close, arrows to navigate
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all duration-150 hover:bg-white/12 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)]"
            onClick={close}
            aria-label="Close preview"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/28 p-2 sm:p-4">
          <button
            className="absolute left-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white transition-all duration-150 hover:bg-black/65 hover:scale-[1.03] disabled:opacity-25 disabled:cursor-not-allowed"
            onClick={goPrev}
            disabled={selectedSlideIndex <= 0}
            aria-label="Previous slide"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className="sf-fade-up rounded-[22px] border border-white/12 bg-white shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
            style={{
              width: `${fittedSize.width}px`,
              height: `${fittedSize.height}px`,
              maxWidth: '100%',
            }}
          >
            {comparisonMode && sourceHtml ? (
              <ComparisonSlider
                sourceHtml={sourceHtml}
                shapes={shapes}
                slideWidth={slideSize.width}
                slideHeight={slideSize.height}
                width={fittedSize.width}
                height={fittedSize.height}
              />
            ) : (
              <SlidePreviewRenderer
                shapes={shapes}
                slideWidth={slideSize.width}
                slideHeight={slideSize.height}
                className="h-full w-full rounded-[18px]"
              />
            )}
          </div>

          <button
            className="absolute right-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white transition-all duration-150 hover:bg-black/65 hover:scale-[1.03] disabled:opacity-25 disabled:cursor-not-allowed"
            onClick={goNext}
            disabled={selectedSlideIndex >= totalSlides - 1}
            aria-label="Next slide"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/35 px-4 py-2 text-xs text-[#CFCFCF] backdrop-blur-sm">
            <span className="tabular-nums">{selectedSlideIndex + 1} / {totalSlides}</span>
            <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden="true" />
            <span className="tabular-nums">Fit {fittedSize.scalePct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
