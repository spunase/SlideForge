import { useConversionStore } from '../store';

export function PreviewGrid() {
  const slides = useConversionStore((s) => s.slides);

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#1A1A1A] mb-3">
          <svg
            className="h-8 w-8 text-[#444444]"
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
        <p className="text-sm text-[#AAAAAA]">No slides yet</p>
        <p className="text-xs text-[#666666] mt-1">Slides will appear here during conversion</p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label="Slide previews"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin"
    >
      {slides.map((slide) => (
        <div
          key={slide.index}
          role="listitem"
          aria-label={`Slide ${slide.index + 1} preview`}
          className="
            group relative aspect-video overflow-hidden rounded-lg
            bg-[#1A1A1A] border border-[#222222]
            transition-all duration-150
            hover:border-[#444444] hover:shadow-lg hover:shadow-black/20
            cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B714] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]
          "
          tabIndex={0}
          onClick={() => {
            // TODO: expand slide preview
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              // TODO: expand slide preview
            }
          }}
        >
          {slide.preview ? (
            <img
              src={slide.preview}
              alt={`Preview of slide ${slide.index + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-2xl font-semibold text-[#333333]">
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
      ))}
    </div>
  );
}
