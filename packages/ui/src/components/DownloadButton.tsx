import { useConversionStore } from '../store';

function getFilenameFromStore(files: Map<string, Blob>): string {
  const firstKey = files.keys().next().value;
  if (typeof firstKey === 'string' && firstKey.length > 0) {
    const baseName = firstKey.replace(/\.[^.]+$/, '');
    return `${baseName}.pptx`;
  }
  return 'presentation.pptx';
}

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes <= 0) {
    return 'Size unavailable';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function DownloadButton() {
  const status = useConversionStore((s) => s.status);
  const downloadUrl = useConversionStore((s) => s.downloadUrl);
  const outputSizeBytes = useConversionStore((s) => s.outputSizeBytes);
  const files = useConversionStore((s) => s.files);
  const reset = useConversionStore((s) => s.reset);

  if (status !== 'done' || !downloadUrl) {
    return null;
  }

  const filename = getFilenameFromStore(files);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl border border-[var(--sf-border)] bg-[var(--sf-panel)]/95 px-4 py-4 backdrop-blur-md sm:px-6">
      <div className="sf-success-reveal inline-flex items-center gap-2 rounded-full border border-[var(--sf-success-border)] bg-[var(--sf-success-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--sf-success-text)]">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[var(--sf-success)]" aria-hidden="true" />
        Ready to Download
      </div>

      <a
        href={downloadUrl}
        download={filename}
        aria-label={`Download ${filename}`}
        className="
          sf-fade-up inline-flex h-12 items-center gap-2.5 rounded-2xl px-8 cursor-pointer
          text-sm font-semibold tracking-[0.01em]
          bg-[var(--sf-cta)] text-white
          transition-all duration-150
          hover:bg-[var(--sf-cta-hover)] hover:shadow-[0_12px_32px_rgba(0,113,227,0.3)] hover:scale-[1.015]
          active:bg-[var(--sf-cta-active)]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-cta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg-1)]
        "
        style={{ animationDelay: '80ms' }}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        Download PPTX
      </a>

      <p className="text-[11px] tracking-[0.01em] text-[var(--sf-text-muted)]">
        {filename} · {formatSize(outputSizeBytes)}
      </p>

      <button
        type="button"
        onClick={reset}
        className="
          sf-fade-up text-xs text-[var(--sf-text-muted)] underline underline-offset-2 decoration-[var(--sf-border-strong)] cursor-pointer
          transition-all duration-150
          hover:text-[var(--sf-text)] hover:decoration-[var(--sf-text-subtle)] hover:bg-[var(--sf-control-bg)] hover:shadow-sm hover:scale-[1.02]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-cta)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sf-bg-1)]
          rounded px-2 py-1
        "
        style={{ animationDelay: '120ms' }}
        aria-label="Start over with a new file"
      >
        Start over
      </button>
    </div>
  );
}
