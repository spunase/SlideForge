import { useConversionStore } from '../store';
import { SlidePreviewRenderer } from './SlidePreviewRenderer';

export function PreviewGrid() {
  const slides = useConversionStore((s) => s.slides);
  const mappedSlides = useConversionStore((s) => s.mappedSlides);
  const slideSize = useConversionStore((s) => s.slideSize);
  const setSelectedSlideIndex = useConversionStore((s) => s.setSelectedSlideIndex);

  if (slides.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A1A1A] mb-2">
          <svg
            className="h-6 w-6 text-[#555555]"
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
        <p className="text-sm text-[#999999]">No slides yet</p>
        <p className="text-xs text-[#777777] mt-0.5">Slides will appear here during conversion</p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Slide previews"
      className="grid h-full grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3"
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
              bg-[#1A1A1A] border border-[#2A2A2A]
              transition-all duration-150
              hover:border-[#444444] hover:shadow-lg hover:shadow-black/20 hover:scale-[1.01]
              cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B714] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]
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
                <span className="text-2xl font-semibold text-[#555555]">
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
          </div>
        );
      })}
    </div>
  );
}
