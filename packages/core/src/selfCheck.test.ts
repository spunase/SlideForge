import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runSelfCheckWithAutoFix } from './selfCheck';

function readAppleFixture(): string {
  const fixturePath = path.resolve(
    __dirname,
    '../../../docs/fixtures/apple-fidelity-test.html',
  );
  return readFileSync(fixturePath, 'utf8');
}

describe('runSelfCheckWithAutoFix', () => {
  it('passes on the full Apple fidelity fixture', async () => {
    const html = readAppleFixture();
    const assets = new Map<string, Blob>();

    const result = await runSelfCheckWithAutoFix(html, assets);

    expect(result.passed).toBe(true);
    expect(result.result).not.toBeNull();
    expect(result.result?.report.slideCount).toBeGreaterThanOrEqual(5);
    expect(result.result?.blob.size ?? 0).toBeGreaterThan(0);
  });

  it('auto-injects slide markers when the input has no slide markers', async () => {
    const html = `
      <div style="padding: 20px;">
        <h1>Slide A</h1>
      </div>
      <div style="padding: 20px;">
        <h1>Slide B</h1>
      </div>
    `;
    const assets = new Map<string, Blob>();

    const result = await runSelfCheckWithAutoFix(
      html,
      assets,
      undefined,
      { minSlides: 2, maxUnsupportedRules: 1000 },
    );

    expect(result.passed).toBe(true);
    expect(
      result.fixesApplied.some(
        (fix) => fix.strategy === 'inject-slide-markers',
      ),
    ).toBe(true);
    expect(result.result?.report.slideCount).toBeGreaterThanOrEqual(2);
  });

  it('fails gracefully on empty input', async () => {
    const assets = new Map<string, Blob>();

    const result = await runSelfCheckWithAutoFix('', assets);

    expect(result.passed).toBe(false);
    expect(result.result).toBeNull();
    expect(result.issues.some((issue) => issue.code === 'SELF_CHECK_EMPTY_INPUT')).toBe(
      true,
    );
  });
});
