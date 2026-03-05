/**
 * Builds the [Content_Types].xml file for a PPTX package.
 *
 * This file declares MIME types for every part in the zip,
 * using both Default (by extension) and Override (by part name) entries.
 */

import { xmlDeclaration } from '../utils/xml.js';

/**
 * Build the [Content_Types].xml content.
 *
 * @param slideCount - Number of slides in the presentation.
 * @param imageCount - Number of images (used for informational purposes;
 *                     actual image types are covered by Default entries).
 */
export function buildContentTypes(slideCount: number, _imageCount: number): string {
  const lines: string[] = [
    xmlDeclaration(),
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    // Default entries by file extension
    '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '  <Default Extension="xml" ContentType="application/xml"/>',
    '  <Default Extension="png" ContentType="image/png"/>',
    '  <Default Extension="jpeg" ContentType="image/jpeg"/>',
    '  <Default Extension="jpg" ContentType="image/jpeg"/>',
    '  <Default Extension="gif" ContentType="image/gif"/>',
    '  <Default Extension="svg" ContentType="image/svg+xml"/>',
    // Override for presentation.xml
    '  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
    // Override for theme
    '  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
    // Override for slide master
    '  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
    // Override for slide layout
    '  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
  ];

  // Override for each slide
  for (let i = 1; i <= slideCount; i++) {
    lines.push(
      `  <Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
    );
  }

  lines.push('</Types>');

  return lines.join('\n');
}
