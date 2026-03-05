import { useCallback, useEffect } from 'react';
import { useConversionStore } from '../store';
import { SlidePreviewRenderer } from './SlidePreviewRenderer';

export function SlidePreviewModal() {
  const selectedSlideIndex = useConversionStore((s) => s.selectedSlideIndex);
  const mappedSlides = useConversionStore((s) => s.mappedSlides);
  const slideSize = useConversionStore((s) => s.slideSize);
  const setSelectedSlideIndex = useConversionStore(
    (s) => s.setSelectedSlideIndex,
  );

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

  if (selectedSlideIndex === null) return null;

  const shapes = mappedSlides[selectedSlideIndex];
  if (!shapes) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={`Slide ${selectedSlideIndex + 1} of ${totalSlides} preview`}
    >
      <div
        className="relative mx-4 flex max-h-[85vh] max-w-[90vw] flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -top-8 right-0 text-[#AAAAAA] hover:text-white transition-colors duration-150"
          onClick={close}
          aria-label="Close preview"
        >
          ESC
        </button>

        <SlidePreviewRenderer
          shapes={shapes}
          slideWidth={slideSize.width}
          slideHeight={slideSize.height}
          className="w-full max-w-4xl rounded-lg shadow-2xl"
        />

        <div className="flex items-center gap-4">
          <button
            className="h-8 w-8 rounded-lg bg-[#1A1A1A] text-white disabled:opacity-30 hover:bg-[#333333] hover:scale-[1.05] transition-all duration-150"
            onClick={goPrev}
            disabled={selectedSlideIndex <= 0}
            aria-label="Previous slide"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="text-sm text-[#AAAAAA] tabular-nums">
            {selectedSlideIndex + 1} / {totalSlides}
          </span>

          <button
            className="h-8 w-8 rounded-lg bg-[#1A1A1A] text-white disabled:opacity-30 hover:bg-[#333333] hover:scale-[1.05] transition-all duration-150"
            onClick={goNext}
            disabled={selectedSlideIndex >= totalSlides - 1}
            aria-label="Next slide"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
