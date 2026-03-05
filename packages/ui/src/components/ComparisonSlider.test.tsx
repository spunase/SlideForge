import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ComparisonSlider } from './ComparisonSlider';
import type { MappedShape } from '@core/types';

// Mock SlidePreviewRenderer to avoid needing full shape rendering
jest.mock('./SlidePreviewRenderer', () => ({
  SlidePreviewRenderer: ({ className }: { className?: string }) => (
    <div data-testid="slide-preview-renderer" className={className}>
      PPTX Preview
    </div>
  ),
}));

const mockShapes: MappedShape[] = [
  {
    geometry: { x: 0, y: 0, width: 1920, height: 100, zIndex: 0 },
    textContent: 'Hello World',
    textStyle: {
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
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
  },
];

const defaultProps = {
  sourceHtml: '<html><body><h1>Test Page</h1></body></html>',
  shapes: mockShapes,
  slideWidth: 1920,
  slideHeight: 1080,
  width: 960,
  height: 540,
};

function getByTestId(container: HTMLElement, testId: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`Could not find element with data-testid="${testId}"`);
  return el as HTMLElement;
}

describe('ComparisonSlider', () => {
  it('renders the comparison container', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    expect(getByTestId(container, 'comparison-slider')).toBeTruthy();
  });

  it('renders the before iframe with sandboxed HTML', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const iframe = getByTestId(container, 'comparison-before');
    expect(iframe.tagName).toBe('IFRAME');
    expect(iframe.getAttribute('sandbox')).toBe('allow-same-origin');
  });

  it('renders the after PPTX preview', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    expect(getByTestId(container, 'slide-preview-renderer')).toBeTruthy();
  });

  it('renders the draggable handle with correct ARIA attributes', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const handle = getByTestId(container, 'comparison-handle');
    expect(handle.getAttribute('role')).toBe('slider');
    expect(handle.getAttribute('aria-valuemin')).toBe('0');
    expect(handle.getAttribute('aria-valuemax')).toBe('100');
  });

  it('starts at 50% position', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const handle = getByTestId(container, 'comparison-handle');
    expect(handle.getAttribute('aria-valuenow')).toBe('50');
  });

  it('renders HTML and PPTX labels', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    expect(container.textContent).toContain('HTML');
    expect(container.textContent).toContain('PPTX');
  });

  it('adjusts position with left arrow key', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const handle = getByTestId(container, 'comparison-handle');
    handle.focus();
    fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    expect(handle.getAttribute('aria-valuenow')).toBe('48');
  });

  it('adjusts position with right arrow key', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const handle = getByTestId(container, 'comparison-handle');
    handle.focus();
    fireEvent.keyDown(handle, { key: 'ArrowRight' });
    expect(handle.getAttribute('aria-valuenow')).toBe('52');
  });

  it('clamps position at 0', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const handle = getByTestId(container, 'comparison-handle');
    handle.focus();
    for (let i = 0; i < 30; i++) {
      fireEvent.keyDown(handle, { key: 'ArrowLeft' });
    }
    expect(Number(handle.getAttribute('aria-valuenow'))).toBe(0);
  });

  it('clamps position at 100', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const handle = getByTestId(container, 'comparison-handle');
    handle.focus();
    for (let i = 0; i < 30; i++) {
      fireEvent.keyDown(handle, { key: 'ArrowRight' });
    }
    expect(Number(handle.getAttribute('aria-valuenow'))).toBe(100);
  });

  it('strips script tags from source HTML', () => {
    const propsWithScript = {
      ...defaultProps,
      sourceHtml: '<html><body><script>alert("xss")</script><h1>Safe</h1></body></html>',
    };
    const { container } = render(<ComparisonSlider {...propsWithScript} />);
    const iframe = getByTestId(container, 'comparison-before') as HTMLIFrameElement;
    const srcDoc = iframe.getAttribute('srcdoc') ?? '';
    expect(srcDoc).not.toContain('<script');
    expect(srcDoc).toContain('<h1>Safe</h1>');
  });

  it('sets correct dimensions on container', () => {
    const { container } = render(<ComparisonSlider {...defaultProps} />);
    const slider = getByTestId(container, 'comparison-slider');
    expect(slider.style.width).toBe('960px');
    expect(slider.style.height).toBe('540px');
  });
});
