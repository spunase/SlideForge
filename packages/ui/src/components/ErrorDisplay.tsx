import { useConversionStore } from '../store';

export function ErrorDisplay() {
  const error = useConversionStore((s) => s.error);
  const reset = useConversionStore((s) => s.reset);

  if (!error) {
    return null;
  }

  return (
    <div
      role="alert"
      className="
        flex flex-col gap-4 rounded-xl
        border border-[#FF4D4D]/30 bg-[#FF4D4D]/5
        p-6
      "
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF4D4D]/10 mt-0.5">
          <svg
            className="h-4 w-4 text-[#FF4D4D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-[#FF4D4D]">
            Error: {error.code}
          </p>
          <p className="text-sm text-[#CCCCCC] leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={reset}
        className="
          self-start h-9 rounded-lg px-4
          text-sm font-medium
          border border-[#FF4D4D]/30 text-[#FF4D4D]
          transition-all duration-150
          hover:bg-[#FF4D4D]/10 hover:border-[#FF4D4D]/50 hover:shadow-md hover:shadow-[#FF4D4D]/10 hover:scale-[1.02]
          active:bg-[#FF4D4D]/15
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D4D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]
        "
        aria-label="Try again by starting over"
      >
        Try again
      </button>
    </div>
  );
}
