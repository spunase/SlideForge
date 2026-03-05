import { useConversionStore } from '../store';

function getFilenameFromStore(files: Map<string, Blob>): string {
  const firstKey = files.keys().next().value;
  if (typeof firstKey === 'string' && firstKey.length > 0) {
    const baseName = firstKey.replace(/\.[^.]+$/, '');
    return `${baseName}.pptx`;
  }
  return 'presentation.pptx';
}

export function DownloadButton() {
  const status = useConversionStore((s) => s.status);
  const downloadUrl = useConversionStore((s) => s.downloadUrl);
  const files = useConversionStore((s) => s.files);
  const reset = useConversionStore((s) => s.reset);

  if (status !== 'done' || !downloadUrl) {
    return null;
  }

  const filename = getFilenameFromStore(files);

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={downloadUrl}
        download={filename}
        aria-label={`Download ${filename}`}
        className="
          inline-flex h-12 items-center gap-2.5 rounded-xl px-8 cursor-pointer
          text-base font-semibold
          bg-[#E2B714] text-[#0D0D0D]
          transition-all duration-150
          hover:bg-[#F0C832] hover:shadow-lg hover:shadow-[#E2B714]/15 hover:scale-[1.02]
          active:bg-[#D4A90F]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B714] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]
        "
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
        Download {filename}
      </a>

      <button
        type="button"
        onClick={reset}
        className="
          text-sm text-[#AAAAAA] underline underline-offset-2 decoration-[#444444] cursor-pointer
          transition-all duration-150
          hover:text-white hover:decoration-[#666666] hover:bg-[#1A1A1A] hover:shadow-sm hover:shadow-black/20 hover:scale-[1.02]
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B714] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]
          rounded px-2 py-1
        "
        aria-label="Start over with a new file"
      >
        Start over
      </button>
    </div>
  );
}
