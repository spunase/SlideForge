import { useConversionStore } from '@ui/store';
import { DropZone } from '@ui/components/DropZone';
import { PreviewGrid } from '@ui/components/PreviewGrid';
import { OptionsBar } from '@ui/components/OptionsBar';
import { ProgressIndicator } from '@ui/components/ProgressIndicator';
import { DownloadButton } from '@ui/components/DownloadButton';
import { ErrorDisplay } from '@ui/components/ErrorDisplay';
import { useConversion } from '@ui/hooks/useConversion';

export function App() {
  const status = useConversionStore((s) => s.status);
  const files = useConversionStore((s) => s.files);
  const { startConversion } = useConversion();

  const hasFiles = files.size > 0;
  const isIdle = status === 'idle';
  const isProcessing = status === 'parsing' || status === 'converting';
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <div className="min-h-screen bg-[#0D0D0D] px-4 py-8 sm:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-[#E2B714]">SlideForge</span>
          </h1>
          <p className="mt-2 text-sm text-[#AAAAAA] sm:text-base">
            HTML &rarr; PowerPoint in seconds
          </p>
        </header>

        {/* Main card */}
        <main
          className="
            rounded-2xl border border-[#1A1A1A] bg-[#0F0F0F]
            p-6 shadow-2xl shadow-black/40
            sm:p-8
          "
        >
          {/* Status announcements for screen readers */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isProcessing && 'Conversion in progress'}
            {isDone && 'Conversion complete. Your file is ready to download.'}
            {isError && 'An error occurred during conversion.'}
          </div>

          <div className="flex flex-col gap-6">
            {/* DropZone: visible when idle or when user might want to change file */}
            {isIdle && <DropZone />}

            {/* Options bar: visible once files are loaded */}
            {hasFiles && !isError && (
              <OptionsBar onGenerate={startConversion} />
            )}

            {/* Progress indicator: visible during conversion */}
            {isProcessing && <ProgressIndicator />}

            {/* Preview grid: visible during conversion and when done */}
            {(isProcessing || isDone) && (
              <section aria-label="Slide previews">
                <PreviewGrid />
              </section>
            )}

            {/* Download button: visible when done */}
            {isDone && (
              <div className="flex justify-center pt-2">
                <DownloadButton />
              </div>
            )}

            {/* Error display */}
            {isError && <ErrorDisplay />}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-[#444444]">
            100% client-side &mdash; your files never leave the browser
          </p>
        </footer>
      </div>
    </div>
  );
}
