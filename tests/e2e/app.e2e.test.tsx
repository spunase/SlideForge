/**
 * End-to-end integration test for the SlideForge web app.
 *
 * Renders the full App component via @testing-library/react in jsdom
 * and exercises every user-facing state transition:
 * idle → file upload → conversion → preview → modal → download → reset
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../../apps/demo/src/App';
import * as convertModule from '@core/convert';
import { useConversionStore } from '@ui/store';
import type { ConversionResult } from '@core/types';
import type { MappedShape } from '@core/types';

// ── Module-level mocks (hoisted by Jest) ──────────────────────────────────────

jest.mock('@core/pipeline/stages/render', () => ({
  inlineCssIntoHtml: jest.fn(async (html: string) => html),
}));

jest.mock('@ui/components/SlidePreviewRenderer', () => ({
  SlidePreviewRenderer: ({ className }: { className?: string }) => (
    <div data-testid="mock-slide-renderer" className={className}>
      PPTX Preview
    </div>
  ),
}));

// ── Fake conversion result ────────────────────────────────────────────────────

function makeShape(text: string): MappedShape {
  return {
    geometry: { x: 0, y: 0, width: 1920, height: 100, zIndex: 0 },
    textContent: text,
    textStyle: {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textTransform: 'none',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      color: '000000',
      alpha: 1,
    },
    fill: { type: 'none' },
    border: { style: 'none', width: 0, color: '000000' },
    shadow: null,
    imageUrl: null,
    warnings: [],
  };
}

const FAKE_BLOB = new Blob(['PPTX-DATA'], {
  type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
});

const FAKE_RESULT: ConversionResult = {
  blob: FAKE_BLOB,
  report: {
    success: true,
    slideCount: 2,
    warnings: [],
    fontSubstitutions: [],
    unsupportedRules: [],
    metrics: {
      timeIngestMs: 1,
      timeRenderMs: 1,
      timeAnalyzeMs: 1,
      timePackageMs: 1,
      timeTotalMs: 4,
      peakMemoryMb: 0,
      outputSizeMb: 0,
    },
  },
  mappedShapes: [[makeShape('Slide One')], [makeShape('Slide Two')]],
};

// ── Fixture HTML ──────────────────────────────────────────────────────────────

const FIXTURE_HTML = `<html><body>
  <section style="width:1920px;height:1080px;background:#fff">
    <h1 style="font-size:48px;color:#333">Slide One</h1>
  </section>
  <section style="width:1920px;height:1080px;background:#f0f0f0">
    <h1 style="font-size:48px;color:#111">Slide Two</h1>
  </section>
</body></html>`;

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeHtmlFile(
  name = 'presentation.html',
  content = FIXTURE_HTML,
): File {
  return new File([content], name, { type: 'text/html' });
}

function simulateDrop(dropZone: HTMLElement, files: File[]): void {
  const dataTransfer = {
    files: Object.assign([...files], {
      item: (i: number) => files[i],
      length: files.length,
    }),
    items: files.map((f) => ({
      kind: 'file' as const,
      type: f.type,
      getAsFile: () => f,
    })),
    types: ['Files'],
  };

  fireEvent.dragEnter(dropZone, { dataTransfer });
  fireEvent.dragOver(dropZone, { dataTransfer });
  fireEvent.drop(dropZone, { dataTransfer });
}

function renderApp() {
  return render(<App />);
}

async function renderAndDropFile(filename = 'presentation.html') {
  renderApp();
  const dropZone = screen.getByRole('button', {
    name: /upload html file/i,
  });
  simulateDrop(dropZone, [makeHtmlFile(filename)]);
  // Wait for the files to be processed
  await waitFor(() => {
    expect(useConversionStore.getState().files.size).toBeGreaterThan(0);
  });
}

async function renderDropAndConvert(filename = 'presentation.html') {
  jest.spyOn(convertModule, 'convert').mockResolvedValue(FAKE_RESULT);
  await renderAndDropFile(filename);

  const generateBtn = await screen.findByRole('button', {
    name: /generate powerpoint/i,
  });
  fireEvent.click(generateBtn);

  await waitFor(() => {
    expect(useConversionStore.getState().status).toBe('done');
  });
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(
    () => 'blob:http://localhost/fake-pptx-url',
  );
  global.URL.revokeObjectURL = jest.fn();

  // Polyfill Blob.prototype.text for jsdom (not implemented)
  if (!Blob.prototype.text) {
    Blob.prototype.text = function () {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(this);
      });
    };
  }
});

afterEach(() => {
  useConversionStore.getState().reset();
  jest.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Idle State
// ═══════════════════════════════════════════════════════════════════════════════

describe('1. Idle State', () => {
  it('renders DropZone and no Generate button on load', () => {
    renderApp();
    expect(
      screen.getByRole('button', { name: /upload html file/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /generate pptx/i }),
    ).not.toBeInTheDocument();
  });

  it('shows default upload prompt text', () => {
    renderApp();
    expect(
      screen.getByText(/drop your html file here/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /download/i })).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. File Upload
// ═══════════════════════════════════════════════════════════════════════════════

describe('2. File Upload', () => {
  it('valid HTML drop shows filename', async () => {
    await renderAndDropFile('my-slides.html');
    expect(screen.getByText('my-slides.html')).toBeInTheDocument();
  });

  it('OptionsBar and Generate button appear after valid drop', async () => {
    await renderAndDropFile();
    const generateBtn = await screen.findByRole('button', {
      name: /generate powerpoint/i,
    });
    expect(generateBtn).toBeEnabled();
  });

  it('dropping invalid file type shows validation alert', async () => {
    renderApp();
    const dropZone = screen.getByRole('button', {
      name: /upload html file/i,
    });
    const pdfFile = new File(['data'], 'document.pdf', {
      type: 'application/pdf',
    });
    simulateDrop(dropZone, [pdfFile]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('dropping CSS-only file shows "needs HTML" alert', async () => {
    renderApp();
    const dropZone = screen.getByRole('button', {
      name: /upload html file/i,
    });
    const cssFile = new File(['body{}'], 'styles.css', { type: 'text/css' });
    simulateDrop(dropZone, [cssFile]);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toMatch(/html/i);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Conversion Flow
// ═══════════════════════════════════════════════════════════════════════════════

describe('3. Conversion Flow', () => {
  it('clicking Generate disables button and starts conversion', async () => {
    // Use a promise that never resolves to freeze in converting state
    jest
      .spyOn(convertModule, 'convert')
      .mockReturnValue(new Promise(() => {}));

    await renderAndDropFile();

    const generateBtn = screen.getByRole('button', {
      name: /generate powerpoint/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(useConversionStore.getState().status).toBe('converting');
    });

    // Button should show converting state
    const updatedBtn = screen.getByRole('button', {
      name: /conversion in progress/i,
    });
    expect(updatedBtn).toBeDisabled();
  });

  it('successful conversion shows slide grid and download link', async () => {
    await renderDropAndConvert();

    // Slide grid is present
    const slideGrid = screen.getByRole('list', {
      name: /slide previews/i,
    });
    expect(slideGrid).toBeInTheDocument();

    // Two slide cards
    const slides = screen.getAllByRole('listitem');
    expect(slides.length).toBe(2);

    // Download link present with correct href
    const downloadLink = screen.getByRole('link', { name: /download/i });
    expect(downloadLink).toHaveAttribute(
      'href',
      'blob:http://localhost/fake-pptx-url',
    );
  });

  it('filename in download link derives from uploaded HTML file', async () => {
    await renderDropAndConvert('my-deck.html');

    const downloadLink = screen.getByRole('link', { name: /download/i });
    expect(downloadLink).toHaveAttribute('download', 'my-deck.pptx');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Slide Preview Grid
// ═══════════════════════════════════════════════════════════════════════════════

describe('4. Slide Preview Grid', () => {
  it('each slide card has correct aria-label', async () => {
    await renderDropAndConvert();

    expect(
      screen.getByRole('listitem', { name: /slide 1 preview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: /slide 2 preview/i }),
    ).toBeInTheDocument();
  });

  it('clicking a slide card opens the modal', async () => {
    await renderDropAndConvert();

    const slide1 = screen.getByRole('listitem', {
      name: /slide 1 preview/i,
    });
    fireEvent.click(slide1);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Slide Modal Navigation
// ═══════════════════════════════════════════════════════════════════════════════

describe('5. Slide Modal Navigation', () => {
  beforeEach(async () => {
    await renderDropAndConvert();
    // Open modal on slide 1
    const slide1 = screen.getByRole('listitem', {
      name: /slide 1 preview/i,
    });
    fireEvent.click(slide1);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('modal shows correct slide index and prev button disabled', () => {
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute(
      'aria-label',
      expect.stringContaining('1'),
    );

    const prevBtn = screen.getByRole('button', {
      name: /previous slide/i,
    });
    expect(prevBtn).toBeDisabled();
  });

  it('ArrowRight navigates to next slide', () => {
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute(
      'aria-label',
      expect.stringContaining('2'),
    );

    // Next button should now be disabled (last slide)
    const nextBtn = screen.getByRole('button', { name: /next slide/i });
    expect(nextBtn).toBeDisabled();
  });

  it('ArrowLeft navigates back', () => {
    // Go to slide 2 first
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    // Go back to slide 1
    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute(
      'aria-label',
      expect.stringContaining('1'),
    );
  });

  it('Escape key closes modal', () => {
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Download & Reset
// ═══════════════════════════════════════════════════════════════════════════════

describe('6. Download & Reset', () => {
  it('download link is absent before conversion', () => {
    renderApp();
    expect(
      screen.queryByRole('link', { name: /download/i }),
    ).not.toBeInTheDocument();
  });

  it('Start Over button resets app to idle', async () => {
    await renderDropAndConvert();

    const startOver = screen.getByRole('button', {
      name: /start over/i,
    });
    fireEvent.click(startOver);

    await waitFor(() => {
      expect(useConversionStore.getState().status).toBe('idle');
    });

    // DropZone should be back
    expect(
      screen.getByRole('button', { name: /upload html file/i }),
    ).toBeInTheDocument();
    // Download link should be gone
    expect(
      screen.queryByRole('link', { name: /download/i }),
    ).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Error Handling
// ═══════════════════════════════════════════════════════════════════════════════

describe('7. Error Handling', () => {
  it('conversion error shows ErrorDisplay with code and message', async () => {
    const error = Object.assign(new Error('No slide markers found'), {
      code: 'NO_SLIDES',
    });
    jest.spyOn(convertModule, 'convert').mockRejectedValue(error);

    await renderAndDropFile();
    const generateBtn = screen.getByRole('button', {
      name: /generate powerpoint/i,
    });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(useConversionStore.getState().status).toBe('error');
    });

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toContain('NO_SLIDES');
    expect(alert.textContent).toMatch(/no slide markers found/i);
  });

  it('Try Again button resets to idle', async () => {
    jest
      .spyOn(convertModule, 'convert')
      .mockRejectedValue(new Error('fail'));

    await renderAndDropFile();
    fireEvent.click(
      screen.getByRole('button', { name: /generate powerpoint/i }),
    );

    await waitFor(() => {
      expect(useConversionStore.getState().status).toBe('error');
    });

    const tryAgain = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgain);

    await waitFor(() => {
      expect(useConversionStore.getState().status).toBe('idle');
    });

    expect(
      screen.getByRole('button', { name: /upload html file/i }),
    ).toBeInTheDocument();
  });

  it('generic error without code falls back to CONVERSION_ERROR', async () => {
    jest
      .spyOn(convertModule, 'convert')
      .mockRejectedValue(new Error('Unexpected failure'));

    await renderAndDropFile();
    fireEvent.click(
      screen.getByRole('button', { name: /generate powerpoint/i }),
    );

    await waitFor(() => {
      expect(useConversionStore.getState().status).toBe('error');
    });

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('CONVERSION_ERROR');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Accessibility Announcements
// ═══════════════════════════════════════════════════════════════════════════════

describe('8. Accessibility', () => {
  it('aria-live region announces converting state', async () => {
    jest
      .spyOn(convertModule, 'convert')
      .mockReturnValue(new Promise(() => {}));

    await renderAndDropFile();
    fireEvent.click(
      screen.getByRole('button', { name: /generate powerpoint/i }),
    );

    await waitFor(() => {
      expect(useConversionStore.getState().status).toBe('converting');
    });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion!.textContent).toContain('Conversion in progress');
  });

  it('aria-live region announces done state', async () => {
    await renderDropAndConvert();

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion!.textContent).toContain('Conversion complete');
  });
});
