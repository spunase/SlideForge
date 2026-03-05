import { useConversionStore } from '@ui/store';
import { DropZone } from '@ui/components/DropZone';
import { PreviewGrid } from '@ui/components/PreviewGrid';
import { OptionsBar } from '@ui/components/OptionsBar';
import { ProgressIndicator } from '@ui/components/ProgressIndicator';
import { DownloadButton } from '@ui/components/DownloadButton';
import { ErrorDisplay } from '@ui/components/ErrorDisplay';
import { SlidePreviewModal } from '@ui/components/SlidePreviewModal';
import { useConversion } from '@ui/hooks/useConversion';

export function App() {
  const status = useConversionStore((s) => s.status);
  const files = useConversionStore((s) => s.files);
  const { startConversion, runSelfCheck } = useConversion();

  const hasFiles = files.size > 0;
  const isIdle = status === 'idle';
  const isProcessing = status === 'parsing' || status === 'converting';
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <div className="relative isolate flex h-screen flex-col overflow-hidden bg-[var(--sf-bg-1)] px-4 py-4 sm:py-6">
      <div className="sf-atmosphere" aria-hidden="true" />
      <div className="sf-noise" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="mb-4 shrink-0 text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-[#E2B714]">SlideForge</span>
          </h1>
          <p className="mt-1 text-xs text-[#999999] sm:text-sm">
            HTML &rarr; PowerPoint in seconds
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={runSelfCheck}
              disabled={isProcessing}
              className="
                h-9 rounded-lg border border-[#2A2A2A] bg-[#141414] px-4 cursor-pointer
                text-xs font-semibold uppercase tracking-wide text-[#E2B714]
                transition-all duration-150
                hover:border-[#3B3B3B] hover:bg-[#1A1A1A]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B714] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D]
                disabled:cursor-not-allowed disabled:opacity-40
              "
            >
              {isProcessing ? 'Self-Check Running...' : 'Run Full Self-Check Fixture'}
            </button>
          </div>
        </header>

        {/* Main card fills remaining space */}
        <main
          className="
            flex flex-1 flex-col overflow-hidden
            rounded-2xl border border-[color:var(--sf-border)] bg-[color:var(--sf-panel)]/95 backdrop-blur-sm
            p-4 shadow-[var(--sf-shadow-soft)]
            sm:p-6
          "
        >
          {/* Status announcements for screen readers */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {isProcessing && 'Conversion in progress'}
            {isDone && 'Conversion complete. Your file is ready to download.'}
            {isError && 'An error occurred during conversion.'}
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-hidden">
            {/* Upload zone always visible when idle */}
            {isIdle && <DropZone />}

            {/* Options bar visible once files are loaded */}
            {hasFiles && !isError && !isDone && (
              <OptionsBar onGenerate={startConversion} />
            )}

            {/* Progress indicator */}
            {isProcessing && <ProgressIndicator />}

            {/* Preview grid scrollable within its bounds */}
            {(isProcessing || isDone) && (
              <section aria-label="Slide previews" className="min-h-0 flex-1 overflow-hidden">
                <PreviewGrid />
              </section>
            )}

            {/* Download button */}
            {isDone && (
              <div className="flex shrink-0 justify-center pt-1 sf-fade-up">
                <DownloadButton />
              </div>
            )}

            {/* Error display */}
            {isError && <ErrorDisplay />}
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-3 shrink-0 text-center">
          <p className="text-xs text-[#888888]">
            100% client-side &mdash; your files never leave the browser
          </p>
        </footer>
      </div>

      {/* Slide preview modal renders as overlay when a slide is selected */}
      <SlidePreviewModal />
    </div>
  );
}
