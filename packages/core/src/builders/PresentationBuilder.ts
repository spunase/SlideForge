/**
 * Builds the ppt/presentation.xml file.
 *
 * This is the main presentation part that lists all slides and defines
 * the slide dimensions.
 */

import { xmlDeclaration } from '../utils/xml.js';

/**
 * Build the presentation.xml content.
 *
 * @param slideCount - Number of slides.
 * @param width - Slide width in EMU.
 * @param height - Slide height in EMU.
 */
export function buildPresentation(
  slideCount: number,
  width: number,
  height: number,
): string {
  const lines: string[] = [
    xmlDeclaration(),
    '<p:presentation',
    '  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
    '  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    '  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"',
    '  saveSubsetFonts="1">',
    '  <p:sldMasterIdLst>',
    `    <p:sldMasterId id="2147483648" r:id="rId${slideCount + 1}"/>`,
    '  </p:sldMasterIdLst>',
    '  <p:sldIdLst>',
  ];

  // Each slide gets a unique id starting at 256
  for (let i = 1; i <= slideCount; i++) {
    lines.push(`    <p:sldId id="${255 + i}" r:id="rId${i}"/>`);
  }

  lines.push('  </p:sldIdLst>');
  lines.push(`  <p:sldSz cx="${width}" cy="${height}" type="custom"/>`);
  lines.push(`  <p:notesSz cx="${width}" cy="${height}"/>`);
  lines.push('</p:presentation>');

  return lines.join('\n');
}
