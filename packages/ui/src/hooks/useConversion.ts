import { useCallback, useRef } from 'react';
import { convert } from '@core/convert';
import { inlineCssIntoHtml } from '@core/pipeline/stages/render';
import { runSelfCheckWithAutoFix } from '@core/selfCheck';
import type { ConversionOptions, ProgressInfo, SelfCheckIssue } from '@core/types';
import { useConversionStore } from '../store';

const SELF_CHECK_FIXTURE_URL = '/fixtures/apple-fidelity-test.html';

function summarizeSelfCheckIssues(issues: SelfCheckIssue[]): string {
  if (issues.length === 0) {
    return 'Self-check failed for an unknown reason.';
  }

  const topIssues = issues
    .slice(0, 3)
    .map((issue) => `${issue.code}: ${issue.message}`);

  return `Self-check failed: ${topIssues.join(' | ')}`;
}

export function useConversion() {
  const files = useConversionStore((s) => s.files);
  const slideSize = useConversionStore((s) => s.slideSize);
  const setStatus = useConversionStore((s) => s.setStatus);
  const setProgress = useConversionStore((s) => s.setProgress);
  const setStage = useConversionStore((s) => s.setStage);
  const setDownloadUrl = useConversionStore((s) => s.setDownloadUrl);
  const setOutputSizeBytes = useConversionStore((s) => s.setOutputSizeBytes);
  const setError = useConversionStore((s) => s.setError);
  const setMappedSlides = useConversionStore((s) => s.setMappedSlides);
  const addSlidePreview = useConversionStore((s) => s.addSlidePreview);
  const setSourceHtml = useConversionStore((s) => s.setSourceHtml);

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

    // Read the HTML file as text and inline external CSS for the comparison view
    const htmlString = await htmlFile.text();
    const htmlWithCss = await inlineCssIntoHtml(htmlString, files);
    setSourceHtml(htmlWithCss);

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
    setOutputSizeBytes(null);
    setError(null);

    try {
      const result = await convert(htmlString, files, options, onProgress, controller.signal);

      // Store mapped shapes for browser preview
      setMappedSlides(result.mappedShapes);
      for (let i = 0; i < result.mappedShapes.length; i++) {
        addSlidePreview('', i);
      }

      // Create a downloadable blob URL from the result
      const url = URL.createObjectURL(result.blob);
      setDownloadUrl(url);
      setOutputSizeBytes(result.blob.size);
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
  }, [files, slideSize, setStatus, setProgress, setStage, setDownloadUrl, setOutputSizeBytes, setError, setMappedSlides, addSlidePreview, setSourceHtml]);

  const runSelfCheck = useCallback(async () => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus('converting');
    setProgress(0);
    setStage('self-check');
    setOutputSizeBytes(null);
    setError(null);

    const onProgress = (info: ProgressInfo) => {
      setProgress(info.progress);
      setStage(`self-check:${info.stage}`);
    };

    try {
      const response = await fetch(SELF_CHECK_FIXTURE_URL, {
        signal: controller.signal,
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Self-check fixture could not be loaded (${response.status}).`);
      }

      const fixtureHtml = await response.text();
      const fixtureAssets = new Map<string, Blob>();
      fixtureAssets.set(
        'apple-fidelity-test.html',
        new Blob([fixtureHtml], { type: 'text/html' }),
      );

      const selfCheck = await runSelfCheckWithAutoFix(
        fixtureHtml,
        fixtureAssets,
        {
          slideWidth: slideSize.width,
          slideHeight: slideSize.height,
        },
        undefined,
        onProgress,
        controller.signal,
      );

      if (!selfCheck.passed || !selfCheck.result) {
        setError({
          code: 'SELF_CHECK_FAILED',
          message: summarizeSelfCheckIssues(selfCheck.issues),
        });
        setStatus('error');
        return;
      }

      const url = URL.createObjectURL(selfCheck.result.blob);
      setDownloadUrl(url);
      setOutputSizeBytes(selfCheck.result.blob.size);
      setProgress(100);

      if (selfCheck.fixesApplied.length > 0) {
        setStage(`self-check: passed with ${selfCheck.fixesApplied.length} auto-fix(es)`);
      } else {
        setStage('self-check: passed');
      }

      setStatus('done');
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setStatus('idle');
        setProgress(0);
        setStage(null);
        return;
      }

      const message =
        err instanceof Error
          ? err.message
          : 'An unknown error occurred during self-check.';

      setError({
        code: 'SELF_CHECK_ERROR',
        message,
      });
      setStatus('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [slideSize.height, slideSize.width, setStatus, setProgress, setStage, setError, setDownloadUrl, setOutputSizeBytes]);

  const cancelConversion = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus('idle');
    setProgress(0);
    setStage(null);
  }, [setStatus, setProgress, setStage]);

  return { startConversion, cancelConversion, runSelfCheck };
}
