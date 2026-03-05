import { useCallback, useRef } from 'react';
import { convert } from '@slideforge/core';
import type { ConversionOptions, ProgressInfo } from '@slideforge/core';
import { useConversionStore } from '../store';

export function useConversion() {
  const files = useConversionStore((s) => s.files);
  const slideSize = useConversionStore((s) => s.slideSize);
  const setStatus = useConversionStore((s) => s.setStatus);
  const setProgress = useConversionStore((s) => s.setProgress);
  const setStage = useConversionStore((s) => s.setStage);
  const setDownloadUrl = useConversionStore((s) => s.setDownloadUrl);
  const setError = useConversionStore((s) => s.setError);

  const abortControllerRef = useRef<AbortController | null>(null);

  const startConversion = useCallback(async () => {
    // Find the first HTML file in the files map
    let htmlFile: Blob | undefined;
    for (const [name, blob] of files) {
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        htmlFile = blob;
        break;
      }
    }

    if (!htmlFile) {
      setError({ code: 'NO_HTML', message: 'No HTML file found in the uploaded files.' });
      return;
    }

    // Read the HTML file as text
    const htmlString = await htmlFile.text();

    // Build conversion options from slide size
    const options: ConversionOptions = {
      slideWidth: slideSize.width,
      slideHeight: slideSize.height,
    };

    // Set up abort controller for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Progress callback
    const onProgress = (info: ProgressInfo) => {
      setProgress(info.progress);
      setStage(info.stage);
    };

    // Begin conversion
    setStatus('converting');
    setProgress(0);
    setStage(null);
    setError(null);

    try {
      const result = await convert(htmlString, files, options, onProgress, controller.signal);

      // Create a downloadable blob URL from the result
      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);
      setStatus('done');
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        // User cancelled — reset to idle
        setStatus('idle');
        setProgress(0);
        setStage(null);
        return;
      }

      const message = err instanceof Error ? err.message : 'An unknown error occurred during conversion.';
      const code = (err as { code?: string })?.code ?? 'CONVERSION_ERROR';
      setError({ code, message });
      setStatus('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [files, slideSize, setStatus, setProgress, setStage, setDownloadUrl, setError]);

  const cancelConversion = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setProgress(0);
    setStage(null);
  }, [setStatus, setProgress, setStage]);

  return { startConversion, cancelConversion };
}
