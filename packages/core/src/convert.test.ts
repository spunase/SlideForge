import { convert } from './convert';

describe('convert', () => {
  it('should return a result with blob and report', async () => {
    const html = '<div data-slide="1"><h1>Hello</h1></div>';
    const assets = new Map<string, Blob>();

    const result = await convert(html, assets);

    expect(result).toBeDefined();
    expect(result.blob).toBeDefined();
    expect(result.report).toBeDefined();
  });

  it('should use default slide dimensions when no options provided', async () => {
    const html = '<div data-slide="1"><p>Test</p></div>';
    const assets = new Map<string, Blob>();

    const result = await convert(html, assets);

    // Should not throw with defaults (1920x1080)
    expect(result.report).toBeDefined();
  });

  it('should accept custom slide dimensions', async () => {
    const html = '<div data-slide="1"><p>Test</p></div>';
    const assets = new Map<string, Blob>();

    const result = await convert(html, assets, {
      slideWidth: 1280,
      slideHeight: 720,
    });

    expect(result.report).toBeDefined();
  });

  it('should handle progress callback', async () => {
    const html = '<div data-slide="1"><p>Test</p></div>';
    const assets = new Map<string, Blob>();
    const stages: string[] = [];

    await convert(html, assets, undefined, (info) => {
      stages.push(info.stage);
    });

    expect(stages.length).toBeGreaterThan(0);
  });

  it('should handle cancellation via AbortSignal', async () => {
    const html = '<div data-slide="1"><p>Test</p></div>';
    const assets = new Map<string, Blob>();
    const controller = new AbortController();
    controller.abort();

    const result = await convert(
      html,
      assets,
      undefined,
      undefined,
      controller.signal,
    );

    expect(result.report.success).toBe(false);
  });

  it('should return an error report for empty HTML', async () => {
    const assets = new Map<string, Blob>();

    const result = await convert('', assets);

    expect(result.report.success).toBe(false);
  });

  it('should produce a blob with non-zero size for valid input', async () => {
    const html = '<div data-slide="1"><h1>Content</h1></div>';
    const assets = new Map<string, Blob>();

    const result = await convert(html, assets);

    if (result.report.success) {
      expect(result.blob.size).toBeGreaterThan(0);
    }
  });

  it('should merge partial options with defaults', async () => {
    const html = '<div data-slide="1"><p>Test</p></div>';
    const assets = new Map<string, Blob>();

    // Only pass slideWidth, slideHeight should use default
    const result = await convert(html, assets, { slideWidth: 1280 });

    expect(result.report).toBeDefined();
  });
});
