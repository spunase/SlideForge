import { segmentSlides } from './SlideSegmenter';

describe('segmentSlides', () => {
  describe('empty input', () => {
    it('should return empty segments for empty string', () => {
      const { segments } = segmentSlides('');
      expect(segments).toHaveLength(0);
    });

    it('should return empty segments for whitespace-only string', () => {
      const { segments } = segmentSlides('   ');
      expect(segments).toHaveLength(0);
    });
  });

  describe('Priority 1: data-slide attribute', () => {
    it('should segment by data-slide attributes', () => {
      const html = `
        <div data-slide="1"><h1>Slide 1</h1></div>
        <div data-slide="2"><h1>Slide 2</h1></div>
      `;
      const { segments, warnings } = segmentSlides(html);
      expect(segments).toHaveLength(2);
      expect(warnings).toHaveLength(0);
    });

    it('should prefer data-slide over .slide class', () => {
      const html = `
        <div data-slide="1"><h1>Data Slide</h1></div>
        <div class="slide"><h1>Class Slide</h1></div>
      `;
      const { segments } = segmentSlides(html);
      // data-slide takes priority, so only 1 segment (from data-slide)
      expect(segments).toHaveLength(1);
      expect(segments[0]).toContain('Data Slide');
    });
  });

  describe('Priority 2: .slide class', () => {
    it('should segment by .slide class', () => {
      const html = `
        <div class="slide"><h1>Slide A</h1></div>
        <div class="slide"><h1>Slide B</h1></div>
        <div class="slide"><h1>Slide C</h1></div>
      `;
      const { segments } = segmentSlides(html);
      expect(segments).toHaveLength(3);
    });
  });

  describe('Priority 3: top-level <section> elements', () => {
    it('should segment by top-level sections', () => {
      const html = `
        <section><h1>Section 1</h1></section>
        <section><h1>Section 2</h1></section>
        <section><h1>Section 3</h1></section>
      `;
      const { segments } = segmentSlides(html);
      expect(segments).toHaveLength(3);
    });

    it('should only pick direct children sections', () => {
      const html = `
        <section>
          <h1>Outer Section</h1>
          <section><p>Nested (not counted as separate)</p></section>
        </section>
      `;
      const { segments } = segmentSlides(html);
      // :scope > section selects only the outer one
      expect(segments).toHaveLength(1);
    });
  });

  describe('Priority 4: fallback to entire body', () => {
    it('should treat whole content as single slide when no markers found', () => {
      const html = '<div><h1>Hello</h1><p>World</p></div>';
      const { segments, warnings } = segmentSlides(html);
      expect(segments).toHaveLength(1);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]!.code).toBe('SF-CSS-002');
    });

    it('should include a warning about no markers found', () => {
      const html = '<p>Just a paragraph</p>';
      const { warnings } = segmentSlides(html);
      expect(warnings.some(w => w.message.includes('No slide markers'))).toBe(true);
    });
  });

  describe('HTML wrapping', () => {
    it('should handle HTML with existing body tag', () => {
      const html = '<html><body><div data-slide="1">Content</div></body></html>';
      const { segments } = segmentSlides(html);
      expect(segments).toHaveLength(1);
    });

    it('should wrap bare HTML without body tag', () => {
      const html = '<div data-slide="1">Content</div>';
      const { segments } = segmentSlides(html);
      expect(segments).toHaveLength(1);
    });

    it('should preserve head styles for each extracted segment', () => {
      const html = `
        <html>
          <head>
            <style>.slide { background: rgb(255, 0, 0); }</style>
          </head>
          <body>
            <section class="slide" data-slide="1"><h1>Styled</h1></section>
          </body>
        </html>
      `;

      const { segments } = segmentSlides(html);
      expect(segments).toHaveLength(1);
      expect(segments[0]).toContain('<head>');
      expect(segments[0]).toContain('.slide { background: rgb(255, 0, 0); }');
    });
  });
});
