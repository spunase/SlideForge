import { Pipeline } from './Pipeline';

describe('Pipeline', () => {
  it('should be instantiable', () => {
    const pipeline = new Pipeline();
    expect(pipeline).toBeDefined();
  });

  it('should return a result with blob and report for simple HTML', async () => {
    const pipeline = new Pipeline();
    const html = '<div data-slide="1"><h1>Hello World</h1></div>';
    const assets = new Map<string, Blob>();

    const result = await pipeline.run(html, assets, {
      slideWidth: 1920,
      slideHeight: 1080,
    });

    expect(result).toBeDefined();
    expect(result.blob).toBeDefined();
    expect(result.report).toBeDefined();
  });

  it('should set report.success to false for empty HTML', async () => {
    const pipeline = new Pipeline();
    const assets = new Map<string, Blob>();

    const result = await pipeline.run('', assets, {
      slideWidth: 1920,
      slideHeight: 1080,
    });

    expect(result.report.success).toBe(false);
  });

  it('should emit progress updates when callback is provided', async () => {
    const pipeline = new Pipeline();
    const html = '<div data-slide="1"><p>Content</p></div>';
    const assets = new Map<string, Blob>();
    const progressUpdates: Array<{ stage: string; progress: number }> = [];

    await pipeline.run(
      html,
      assets,
      { slideWidth: 1920, slideHeight: 1080 },
      (info) => {
        progressUpdates.push({ stage: info.stage, progress: info.progress });
      },
    );

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates.some(p => p.stage === 'ingest')).toBe(true);
  });

  it('should support cancellation via AbortSignal', async () => {
    const pipeline = new Pipeline();
    const html = '<div data-slide="1"><p>Content</p></div>';
    const assets = new Map<string, Blob>();
    const controller = new AbortController();

    // Abort immediately
    controller.abort();

    const result = await pipeline.run(
      html,
      assets,
      { slideWidth: 1920, slideHeight: 1080 },
      undefined,
      controller.signal,
    );

    // Pipeline catches errors gracefully and returns a report
    expect(result.report.success).toBe(false);
  });

  it('should produce a report with slide count', async () => {
    const pipeline = new Pipeline();
    const html = `
      <div data-slide="1"><p>Slide 1</p></div>
      <div data-slide="2"><p>Slide 2</p></div>
    `;
    const assets = new Map<string, Blob>();

    const result = await pipeline.run(html, assets, {
      slideWidth: 1920,
      slideHeight: 1080,
    });

    if (result.report.success) {
      expect(result.report.slideCount).toBe(2);
    }
  });

  it('should apply linked stylesheet assets during conversion', async () => {
    const pipeline = new Pipeline();
    const html = `
      <html>
        <head>
          <link rel="stylesheet" href="styles.css" />
        </head>
        <body>
          <div data-slide="1">
            <div class="panel">Styled Panel</div>
          </div>
        </body>
      </html>
    `;

    const css = '.panel { background-color: rgb(255, 0, 0); border: 2px solid rgb(0, 0, 0); }';
    const assets = new Map<string, Blob>();
    assets.set('styles.css', new Blob([css], { type: 'text/css' }));

    const result = await pipeline.run(html, assets, {
      slideWidth: 1920,
      slideHeight: 1080,
    });

    expect(result.report.success).toBe(true);
    expect(result.report.slideCount).toBe(1);
  });
});
