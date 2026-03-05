import { useConversionStore } from '../store';

export function ProgressIndicator() {
  const progress = useConversionStore((s) => s.progress);
  const currentStage = useConversionStore((s) => s.currentStage);
  const status = useConversionStore((s) => s.status);

  const isActive = status === 'parsing' || status === 'converting';
  const isDone = status === 'done';

  const stageLabel = isDone ? 'Done!' : currentStage ?? 'Preparing...';

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="relative w-full overflow-hidden rounded-full bg-[#1A1A1A] h-1.5">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Conversion progress: ${progress}%`}
          className="h-full rounded-full bg-[#E2B714] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Stage indicator */}
      <div
        className="flex items-center gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {isActive && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E2B714] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E2B714]" />
          </span>
        )}
        {isDone && (
          <svg
            className="h-4 w-4 text-[#23C16B]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span
          className={`text-sm ${isDone ? 'font-medium text-[#23C16B]' : 'text-[#AAAAAA]'}`}
        >
          {stageLabel}
        </span>
        {isActive && (
          <span className="text-xs text-[#999999] ml-auto tabular-nums">
            {progress}%
          </span>
        )}
      </div>
    </div>
  );
}
