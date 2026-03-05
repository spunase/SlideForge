/**
 * SlideBuilder — generates the XML for individual PPTX slides.
 *
 * This is the core builder that converts shape descriptions into
 * DrawingML (OOXML) markup within a `<p:sld>` element.
 */

import { xmlDeclaration } from '../utils/xml.js';
import { escapeXml } from '../utils/xml.js';
import { ptToHalfPt } from '../utils/emu.js';
import { colorToSrgbClr } from '../utils/color.js';

// ─── Interfaces ──────────────────────────────────────────────────────

export interface TextRun {
  text: string;
  fontFamily: string;
  fontSize: number; // points
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string; // RRGGBB hex (no #)
  underline: boolean;
}

export interface SolidFill {
  type: 'solid';
  color: string; // RRGGBB hex
  alpha?: number; // 0–1
}

export interface GradientStop {
  position: number; // 0–100000 (OOXML percentage scale)
  color: string; // RRGGBB hex
}

export interface GradientFill {
  type: 'gradient';
  angle: number; // degrees (0–360)
  stops: GradientStop[];
}

export interface NoneFill {
  type: 'none';
}

export type ShapeFill = SolidFill | GradientFill | NoneFill;

export interface ShapeBorder {
  width: number; // EMU
  color: string; // RRGGBB hex
  dashStyle?: string; // e.g. "dash", "dot", "lgDash", "sysDash"
  radius?: number; // corner radius in EMU for rounded rectangles
}

export interface ShapeShadow {
  blurRad: number; // blur radius in EMU
  dist: number; // distance in EMU
  dir: number; // direction in 60000ths of a degree (e.g. 2700000 = 45deg)
  color: string; // RRGGBB hex
  alpha: number; // 0–1
}

export interface SlideShape {
  id: number;
  name: string;
  type: 'text' | 'image' | 'rect';
  x: number; // EMU
  y: number; // EMU
  width: number; // EMU
  height: number; // EMU
  fill?: ShapeFill;
  border?: ShapeBorder;
  shadow?: ShapeShadow;
  textRuns?: TextRun[];
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  imageRId?: string; // relationship ID for image shapes
}

// ─── Namespace Constants ─────────────────────────────────────────────

const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main';

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Build the fill XML for a shape's `<p:spPr>`.
 */
function buildFillXml(fill: ShapeFill): string {
  switch (fill.type) {
    case 'solid':
      return `<a:solidFill>${colorToSrgbClr(fill.color, fill.alpha)}</a:solidFill>`;

    case 'gradient': {
      // OOXML gradient angle is in 60000ths of a degree
      const ooxmlAngle = Math.round(fill.angle * 60000);
      const stopsXml = fill.stops
        .map(
          (stop) =>
            `<a:gs pos="${stop.position}">${colorToSrgbClr(stop.color)}</a:gs>`,
        )
        .join('');
      return [
        '<a:gradFill>',
        `  <a:gsLst>${stopsXml}</a:gsLst>`,
        `  <a:lin ang="${ooxmlAngle}" scaled="1"/>`,
        '</a:gradFill>',
      ].join('');
    }

    case 'none':
      return '<a:noFill/>';
  }
}

/**
 * Build the outline (border) XML for a shape's `<p:spPr>`.
 */
function buildOutlineXml(border: ShapeBorder): string {
  // Radius-only border (no visible stroke line)
  if (border.width === 0) {
    return '<a:ln w="0"><a:noFill/></a:ln>';
  }

  const parts: string[] = [`<a:ln w="${border.width}">`];

  parts.push(`<a:solidFill>${colorToSrgbClr(border.color)}</a:solidFill>`);

  if (border.dashStyle) {
    parts.push(`<a:prstDash val="${border.dashStyle}"/>`);
  }

  parts.push('</a:ln>');

  return parts.join('');
}

/**
 * Build the shadow XML for a shape's `<p:spPr>` effectLst.
 */
function buildShadowXml(shadow: ShapeShadow): string {
  return [
    '<a:effectLst>',
    `  <a:outerShdw blurRad="${shadow.blurRad}" dist="${shadow.dist}" dir="${shadow.dir}" rotWithShape="0">`,
    `    ${colorToSrgbClr(shadow.color, shadow.alpha)}`,
    '  </a:outerShdw>',
    '</a:effectLst>',
  ].join('');
}

/**
 * Build a preset geometry element. Uses "roundRect" if border has a radius,
 * otherwise uses "rect".
 */
function buildGeometryXml(border?: ShapeBorder): string {
  if (border?.radius && border.radius > 0) {
    // avLst with corner radius for rounded rectangle
    return [
      '<a:prstGeom prst="roundRect">',
      '  <a:avLst>',
      `    <a:gd name="adj" fmla="val ${border.radius}"/>`,
      '  </a:avLst>',
      '</a:prstGeom>',
    ].join('');
  }
  return '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
}

/**
 * Build text run properties XML.
 */
function buildRunPropertiesXml(run: TextRun): string {
  const attrs: string[] = [
    `lang="en-US"`,
    `dirty="0"`,
    `sz="${ptToHalfPt(run.fontSize)}"`,
  ];

  if (run.fontWeight === 'bold') {
    attrs.push('b="1"');
  }
  if (run.fontStyle === 'italic') {
    attrs.push('i="1"');
  }
  if (run.underline) {
    attrs.push('u="sng"');
  }

  const children: string[] = [
    `<a:solidFill>${colorToSrgbClr(run.color)}</a:solidFill>`,
    `<a:latin typeface="${escapeXml(run.fontFamily)}"/>`,
    `<a:cs typeface="${escapeXml(run.fontFamily)}"/>`,
  ];

  return `<a:rPr ${attrs.join(' ')}>${children.join('')}</a:rPr>`;
}

/**
 * Map CSS text-align to OOXML paragraph alignment attribute value.
 */
function cssAlignToOoxml(align: string | undefined): string | undefined {
  switch (align) {
    case 'center':  return 'ctr';
    case 'right':   return 'r';
    case 'justify': return 'just';
    case 'left':    return 'l';
    default:        return undefined;
  }
}

/**
 * Build the `<p:txBody>` for a shape containing text runs.
 */
function buildTextBodyXml(textRuns: TextRun[], textAlign?: string): string {
  const algnVal = cssAlignToOoxml(textAlign);
  const pPr = algnVal ? `    <a:pPr algn="${algnVal}"/>` : null;

  const parts: string[] = [
    '<p:txBody>',
    '  <a:bodyPr wrap="square" rtlCol="0"/>',
    '  <a:lstStyle/>',
    '  <a:p>',
  ];

  if (pPr) {
    parts.push(pPr);
  }

  for (const run of textRuns) {
    parts.push(
      `    <a:r>${buildRunPropertiesXml(run)}<a:t>${escapeXml(run.text)}</a:t></a:r>`,
    );
  }

  // End paragraph marker
  parts.push('    <a:endParaRPr lang="en-US" dirty="0"/>');
  parts.push('  </a:p>');
  parts.push('</p:txBody>');

  return parts.join('\n');
}

/**
 * Build a `<p:sp>` element for a text or rect shape.
 */
function buildShapeXml(shape: SlideShape): string {
  const parts: string[] = [
    '<p:sp>',
    // Non-visual shape properties
    '  <p:nvSpPr>',
    `    <p:cNvPr id="${shape.id}" name="${escapeXml(shape.name)}"/>`,
    '    <p:cNvSpPr/>',
    '    <p:nvPr/>',
    '  </p:nvSpPr>',
    // Shape properties
    '  <p:spPr>',
    '    <a:xfrm>',
    `      <a:off x="${shape.x}" y="${shape.y}"/>`,
    `      <a:ext cx="${shape.width}" cy="${shape.height}"/>`,
    '    </a:xfrm>',
    `    ${buildGeometryXml(shape.border)}`,
  ];

  // Fill
  if (shape.fill) {
    parts.push(`    ${buildFillXml(shape.fill)}`);
  } else {
    parts.push('    <a:noFill/>');
  }

  // Outline / border
  if (shape.border) {
    parts.push(`    ${buildOutlineXml(shape.border)}`);
  }

  // Shadow
  if (shape.shadow) {
    parts.push(`    ${buildShadowXml(shape.shadow)}`);
  }

  parts.push('  </p:spPr>');

  // Text body
  if (shape.textRuns && shape.textRuns.length > 0) {
    parts.push(`  ${buildTextBodyXml(shape.textRuns, shape.textAlign)}`);
  } else {
    // Empty text body required by OOXML for shape elements
    parts.push('  <p:txBody>');
    parts.push('    <a:bodyPr/>');
    parts.push('    <a:lstStyle/>');
    parts.push('    <a:p><a:endParaRPr lang="en-US" dirty="0"/></a:p>');
    parts.push('  </p:txBody>');
  }

  parts.push('</p:sp>');

  return parts.join('\n');
}

/**
 * Build a `<p:pic>` element for an image shape.
 */
function buildPictureXml(shape: SlideShape): string {
  if (!shape.imageRId) {
    throw new Error(`Image shape "${shape.name}" is missing imageRId`);
  }

  const parts: string[] = [
    '<p:pic>',
    '  <p:nvPicPr>',
    `    <p:cNvPr id="${shape.id}" name="${escapeXml(shape.name)}"/>`,
    '    <p:cNvPicPr>',
    '      <a:picLocks noChangeAspect="1"/>',
    '    </p:cNvPicPr>',
    '    <p:nvPr/>',
    '  </p:nvPicPr>',
    '  <p:blipFill>',
    `    <a:blip r:embed="${shape.imageRId}"/>`,
    '    <a:stretch>',
    '      <a:fillRect/>',
    '    </a:stretch>',
    '  </p:blipFill>',
    '  <p:spPr>',
    '    <a:xfrm>',
    `      <a:off x="${shape.x}" y="${shape.y}"/>`,
    `      <a:ext cx="${shape.width}" cy="${shape.height}"/>`,
    '    </a:xfrm>',
    '    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
  ];

  // Border on images
  if (shape.border) {
    parts.push(`    ${buildOutlineXml(shape.border)}`);
  }

  // Shadow on images
  if (shape.shadow) {
    parts.push(`    ${buildShadowXml(shape.shadow)}`);
  }

  parts.push('  </p:spPr>');
  parts.push('</p:pic>');

  return parts.join('\n');
}

// ─── Main Export ─────────────────────────────────────────────────────

/**
 * Build the complete XML for a single slide.
 *
 * @param shapes - Array of shapes to render on the slide.
 * @returns Complete XML string for the slideN.xml file.
 */
export function buildSlideXml(shapes: SlideShape[]): string {
  const parts: string[] = [
    xmlDeclaration(),
    `<p:sld xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}">`,
    '<p:cSld>',
    '<p:spTree>',
    // Non-visual group shape properties (required root element)
    '<p:nvGrpSpPr>',
    '  <p:cNvPr id="1" name=""/>',
    '  <p:cNvGrpSpPr/>',
    '  <p:nvPr/>',
    '</p:nvGrpSpPr>',
    '<p:grpSpPr>',
    '  <a:xfrm>',
    '    <a:off x="0" y="0"/>',
    '    <a:ext cx="0" cy="0"/>',
    '    <a:chOff x="0" y="0"/>',
    '    <a:chExt cx="0" cy="0"/>',
    '  </a:xfrm>',
    '</p:grpSpPr>',
  ];

  for (const shape of shapes) {
    if (shape.type === 'image') {
      parts.push(buildPictureXml(shape));
    } else {
      // 'text' and 'rect' are both rendered as <p:sp>
      parts.push(buildShapeXml(shape));
    }
  }

  parts.push('</p:spTree>');
  parts.push('</p:cSld>');
  parts.push('<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>');
  parts.push('</p:sld>');

  return parts.join('\n');
}
