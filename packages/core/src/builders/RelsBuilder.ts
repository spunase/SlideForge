/**
 * OOXML relationship (.rels) builders for PPTX packages.
 *
 * Relationships files define links between parts within the OOXML package.
 */

import { xmlDeclaration } from '../utils/xml.js';

const RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OFFICEDOCUMENT_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument';
const SLIDE_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide';
const SLIDE_MASTER_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster';
const SLIDE_LAYOUT_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout';
const THEME_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme';
const IMAGE_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';

/**
 * Build the root `_rels/.rels` file.
 * Contains a single relationship pointing to ppt/presentation.xml.
 */
export function buildRootRels(): string {
  return [
    xmlDeclaration(),
    `<Relationships xmlns="${RELS_NS}">`,
    `  <Relationship Id="rId1" Type="${OFFICEDOCUMENT_REL}" Target="ppt/presentation.xml"/>`,
    '</Relationships>',
  ].join('\n');
}

/**
 * Build `ppt/_rels/presentation.xml.rels`.
 *
 * Contains relationships to:
 * - Each slide (rId1 .. rIdN)
 * - slideMaster1.xml (rId{N+1})
 * - theme1.xml (rId{N+2})
 */
export function buildPresentationRels(slideCount: number): string {
  const lines: string[] = [
    xmlDeclaration(),
    `<Relationships xmlns="${RELS_NS}">`,
  ];

  // Slide relationships: rId1 through rId{slideCount}
  for (let i = 1; i <= slideCount; i++) {
    lines.push(
      `  <Relationship Id="rId${i}" Type="${SLIDE_REL}" Target="slides/slide${i}.xml"/>`,
    );
  }

  // Slide master
  const masterRId = slideCount + 1;
  lines.push(
    `  <Relationship Id="rId${masterRId}" Type="${SLIDE_MASTER_REL}" Target="slideMasters/slideMaster1.xml"/>`,
  );

  // Theme
  const themeRId = slideCount + 2;
  lines.push(
    `  <Relationship Id="rId${themeRId}" Type="${THEME_REL}" Target="theme/theme1.xml"/>`,
  );

  lines.push('</Relationships>');

  return lines.join('\n');
}

/**
 * Build a per-slide `ppt/slides/_rels/slideN.xml.rels`.
 *
 * Always includes a relationship to slideLayout1.xml.
 * Optionally includes relationships for embedded images.
 *
 * @param imageRIds - Array of relationship IDs for images (e.g. ["rId2", "rId3"]).
 *                    The corresponding targets are ../media/imageN.{ext} but the
 *                    actual mapping is handled by the assembler. Here we just emit
 *                    image relationship entries with sequential media references.
 */
export function buildSlideRels(imageRIds: string[]): string {
  const lines: string[] = [
    xmlDeclaration(),
    `<Relationships xmlns="${RELS_NS}">`,
    `  <Relationship Id="rId1" Type="${SLIDE_LAYOUT_REL}" Target="../slideLayouts/slideLayout1.xml"/>`,
  ];

  for (let i = 0; i < imageRIds.length; i++) {
    const rId = imageRIds[i];
    lines.push(
      `  <Relationship Id="${rId}" Type="${IMAGE_REL}" Target="../media/image${i + 1}.png"/>`,
    );
  }

  lines.push('</Relationships>');

  return lines.join('\n');
}
