/**
 * PptxAssembler — assembles all OOXML parts into a PPTX zip file using JSZip.
 *
 * A PPTX file is a ZIP archive containing XML files following the
 * Office Open XML (OOXML) specification. This module coordinates all
 * the builders to produce a complete, valid PPTX package.
 */

import JSZip from 'jszip';
import type { SlideShape } from '../builders/SlideBuilder.js';
import { buildContentTypes } from '../builders/ContentTypesBuilder.js';
import { buildRootRels, buildPresentationRels, buildSlideRels } from '../builders/RelsBuilder.js';
import { buildPresentation } from '../builders/PresentationBuilder.js';
import { buildSlideXml } from '../builders/SlideBuilder.js';
import {
  buildTheme,
  buildSlideMaster,
  buildSlideLayout,
  buildSlideMasterRels,
  buildSlideLayoutRels,
} from '../builders/StylesBuilder.js';

// ─── Public Interfaces ───────────────────────────────────────────────

export interface SlideImage {
  /** Relationship ID used in the slide XML (e.g. "rId2") */
  rId: string;
  /** Image binary data */
  data: Blob;
  /** File extension without dot (e.g. "png", "jpeg") */
  extension: string;
}

export interface SlideData {
  /** Shapes to render on this slide */
  shapes: SlideShape[];
  /** Images embedded in this slide */
  images: SlideImage[];
}

/** MIME type for PPTX files */
const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

// ─── Main Assembly Function ──────────────────────────────────────────

/**
 * Assemble a complete PPTX file from slide data.
 *
 * @param slides - Array of slide data (shapes + images).
 * @param width  - Slide width in EMU.
 * @param height - Slide height in EMU.
 * @returns A Blob containing the PPTX file.
 */
export async function assemblePptx(
  slides: SlideData[],
  width: number,
  height: number,
): Promise<Blob> {
  const zip = new JSZip();
  const slideCount = slides.length;

  // Count total images across all slides for content types
  let totalImageCount = 0;
  for (const slide of slides) {
    totalImageCount += slide.images.length;
  }

  // ── Root-level files ───────────────────────────────────────────────

  // [Content_Types].xml
  zip.file('[Content_Types].xml', buildContentTypes(slideCount, totalImageCount));

  // _rels/.rels
  zip.file('_rels/.rels', buildRootRels());

  // ── Presentation ───────────────────────────────────────────────────

  // ppt/presentation.xml
  zip.file('ppt/presentation.xml', buildPresentation(slideCount, width, height));

  // ppt/_rels/presentation.xml.rels
  zip.file('ppt/_rels/presentation.xml.rels', buildPresentationRels(slideCount));

  // ── Theme ──────────────────────────────────────────────────────────

  zip.file('ppt/theme/theme1.xml', buildTheme());

  // ── Slide Master ───────────────────────────────────────────────────

  zip.file('ppt/slideMasters/slideMaster1.xml', buildSlideMaster());
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    buildSlideMasterRels(),
  );

  // ── Slide Layout ───────────────────────────────────────────────────

  zip.file('ppt/slideLayouts/slideLayout1.xml', buildSlideLayout());
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    buildSlideLayoutRels(),
  );

  // ── Slides ─────────────────────────────────────────────────────────

  // Global image counter for unique media filenames across slides
  let globalImageIndex = 1;

  for (const [i, slide] of slides.entries()) {
    const slideNum = i + 1;

    // Slide XML
    zip.file(`ppt/slides/slide${slideNum}.xml`, buildSlideXml(slide.shapes));

    // Slide relationships
    const imageRIds = slide.images.map((img) => img.rId);
    const slideRelsContent = buildSlideRels(imageRIds);

    // Fix the image targets in the rels to use proper filenames
    // with correct extensions and global indices
    let fixedRels = slideRelsContent;
    for (const [j, img] of slide.images.entries()) {
      const placeholderTarget = `../media/image${j + 1}.png`;
      const actualTarget = `../media/image${globalImageIndex}.${img.extension}`;
      fixedRels = fixedRels.replace(placeholderTarget, actualTarget);

      // Add image data to media folder
      zip.file(`ppt/media/image${globalImageIndex}.${img.extension}`, img.data);
      globalImageIndex++;
    }

    zip.file(
      `ppt/slides/_rels/slide${slideNum}.xml.rels`,
      fixedRels,
    );
  }

  // ── Generate the ZIP ───────────────────────────────────────────────

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: PPTX_MIME,
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return blob;
}
