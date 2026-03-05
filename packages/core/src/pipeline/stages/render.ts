/**
 * Render stage — parses each slide segment HTML into a DOM document.
 *
 * Phase 1 MVP: Runs in Node/jsdom context using DOMParser.
 * Phase 2 will add real iframe rendering for browser context.
 */

export interface RenderResult {
  documents: Document[];
}

/**
 * Parse each HTML slide segment into a DOM Document for extraction.
 *
 * @param segments - Array of HTML strings, one per slide
 * @returns Parsed DOM documents for each slide
 */
export function render(segments: string[]): RenderResult {
  const parser = new DOMParser();
  const documents: Document[] = [];

  for (const segment of segments) {
    // Ensure the segment is wrapped so DOMParser produces a valid body
    const wrappedHtml = segment.includes('<body')
      ? segment
      : `<html><body>${segment}</body></html>`;

    const doc = parser.parseFromString(wrappedHtml, 'text/html');
    documents.push(doc);
  }

  return { documents };
}
