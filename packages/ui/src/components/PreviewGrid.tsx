import { useConversionStore } from '../store';
import { SlidePreviewRenderer } from './SlidePreviewRenderer';

const SKELETON_COUNT = 6;

export function PreviewGrid() {
  const slides = useConversionStore((s) => s.slides);
  const mappedSlides = useConversionStore((s) => s.mappedSlides);
  const slideSize = useConversionStore((s) => s.slideSize);
  const status = useConversionStore((s) => s.status);
  const setSelectedSlideIndex = useConversionStore((s) => s.setSelectedSlideIndex);

  const isProcessing = status === 'parsing' || status === 'converting';

  if (slides.length === 0 && isProcessing) {
    return (
      <div className="h-full overflow-y-auto pr-1">
      <div
        role="status"
        aria-live="polite"
        aria-label="Generating slide previews"
        className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3"
      >
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="sf-skeleton aspect-video rounded-lg"
            aria-hidden="true"
          />
        ))}
      </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--sf-control-bg)] mb-2">
          <svg
            className="h-6 w-6 text-[var(--sf-icon-placeholder)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
        </div>
        <p className="text-sm text-[var(--sf-text-muted)]">No slides yet</p>
        <p className="text-xs text-[var(--sf-text-subtle)] mt-0.5">Slides will appear here during conversion</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-1">
    <div
      role="list"
      aria-label="Slide previews"
      className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3"
    >
      {slides.map((slide) => {
        const shapes = mappedSlides[slide.index];
        return (
          <div
            key={slide.index}
            role="listitem"
            aria-label={`Slide ${slide.index + 1} preview`}
            className="
              group relative aspect-video overflow-hidden rounded-lg
              bg-[var(--sf-control-bg)] border border-[var(--sf-border)]
              transition-all duration-150
              hover:border-[var(--sf-border-strong)] hover:shadow-[var(--sf-shadow-soft)] hover:scale-[1.012]
              cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg-1)]
            "
            tabIndex={0}
            onClick={() => setSelectedSlideIndex(slide.index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedSlideIndex(slide.index);
              }
            }}
          >
            {slide.preview ? (
              <img
                src={slide.preview}
                alt={`Preview of slide ${slide.index + 1}`}
                className="h-full w-full object-cover transition-transform duration-150 group-hover:scale-[1.03]"
              />
            ) : shapes ? (
              <SlidePreviewRenderer
                shapes={shapes}
                slideWidth={slideSize.width}
                slideHeight={slideSize.height}
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-2xl font-semibold text-[var(--sf-icon-placeholder)]">
                  {slide.index + 1}
                </span>
              </div>
            )}

            <div className="
              absolute inset-x-0 bottom-0
              bg-gradient-to-t from-black/70 to-transparent
              px-2 py-1.5
              opacity-0 group-hover:opacity-100
              transition-opacity duration-150
            ">
              <span className="text-xs font-medium text-white/90">
                Slide {slide.index + 1}
              </span>
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 scale-95">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 3h6v6M9 21H3v-6m0 0l7-7m14 0l-7 7"
                  />
                </svg>
                Open Preview
              </span>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}
