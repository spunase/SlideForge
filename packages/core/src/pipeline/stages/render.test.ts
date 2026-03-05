import { render } from './render';

describe('render stage', () => {
  it('should inline linked stylesheet assets before parsing', async () => {
    const segments = [
      `
        <html>
          <head>
            <link rel="stylesheet" href="styles.css" />
          </head>
          <body>
            <div class="panel">Content</div>
          </body>
        </html>
      `,
    ];

    const assets = new Map<string, Blob>();
    assets.set(
      'styles.css',
      new Blob(['.panel { background-color: rgb(10, 20, 30); }'], {
        type: 'text/css',
      }),
    );

    const result = await render(segments, { slideWidth: 1920, slideHeight: 1080 }, assets);
    const doc = result.documents[0];
    expect(doc).toBeDefined();
    expect(doc?.querySelector('link[rel="stylesheet"]')).toBeNull();
    expect(doc?.querySelector('style[data-inline-source="styles.css"]')).not.toBeNull();
    expect(
      doc?.querySelector('style[data-inline-source="styles.css"]')?.textContent,
    ).toContain('.panel');
  });
});
