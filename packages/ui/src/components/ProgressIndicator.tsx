import { useMemo } from 'react';
import { useConversionStore } from '../store';

const STAGES = [
  { id: 'ingest', label: 'Ingest' },
  { id: 'render', label: 'Render' },
  { id: 'extract', label: 'Extract' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'build', label: 'Build' },
  { id: 'package', label: 'Package' },
  { id: 'report', label: 'Report' },
] as const;

function normalizeStageName(stage: string | null): string | null {
  if (!stage) {
    return null;
  }

  const normalized = stage.toLowerCase().replace('self-check:', '').trim();

  for (const s of STAGES) {
    if (normalized.includes(s.id)) {
      return s.id;
    }
  }

  return null;
}

function formatStageLabel(stage: string | null, isDone: boolean): string {
  if (isDone) {
    return 'Done';
  }

  if (!stage) {
    return 'Preparing';
  }

  return stage
    .replace('self-check:', '')
    .replace(/-/g, ' ')
    .trim();
}

export function ProgressIndicator() {
  const progress = useConversionStore((s) => s.progress);
  const currentStage = useConversionStore((s) => s.currentStage);
  const status = useConversionStore((s) => s.status);

  const isActive = status === 'parsing' || status === 'converting';
  const isDone = status === 'done';
  const normalizedStage = normalizeStageName(currentStage);

  const activeIndex = useMemo(
    () => STAGES.findIndex((stage) => stage.id === normalizedStage),
    [normalizedStage],
  );

  const stageLabel = formatStageLabel(currentStage, isDone);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5" aria-hidden="true">
        {STAGES.map((stage, index) => {
          const state = isDone
            ? 'done'
            : index < activeIndex
              ? 'done'
              : index === activeIndex && isActive
                ? 'active'
                : 'pending';

          return (
            <span
              key={stage.id}
              data-state={state}
              className="sf-progress-chip rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
            >
              {stage.label}
            </span>
          );
        })}
      </div>

      <div className="relative w-full overflow-hidden rounded-full bg-[#1A1A1A] h-1.5">
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Conversion progress: ${progress}%`}
          className="h-full rounded-full bg-[#E2B714] transition-all duration-300 ease-[var(--sf-ease-standard)]"
          style={{ width: `${progress}%` }}
        />
      </div>

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
            className="h-4 w-4 text-[#23C16B] sf-success-reveal"
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
          className={`text-sm capitalize ${isDone ? 'font-medium text-[#23C16B]' : 'text-[#AAAAAA]'}`}
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
