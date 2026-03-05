/**
 * Builders for PPTX theme, slide master, and slide layout parts.
 *
 * These provide the minimal required structural parts for a valid PPTX
 * file that PowerPoint, Google Slides, and LibreOffice Impress can open.
 */

import { xmlDeclaration } from '../utils/xml.js';

// ─── Theme ───────────────────────────────────────────────────────────

/**
 * Build a minimal theme1.xml.
 *
 * Contains the required color scheme, font scheme, and format scheme
 * with sensible defaults.
 */
export function buildTheme(): string {
  return [
    xmlDeclaration(),
    '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SlideForge Theme">',
    '  <a:themeElements>',
    '    <a:clrScheme name="SlideForge">',
    '      <a:dk1><a:srgbClr val="000000"/></a:dk1>',
    '      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>',
    '      <a:dk2><a:srgbClr val="1F1F1F"/></a:dk2>',
    '      <a:lt2><a:srgbClr val="F5F5F5"/></a:lt2>',
    '      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>',
    '      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>',
    '      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>',
    '      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>',
    '      <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>',
    '      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>',
    '      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>',
    '      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>',
    '    </a:clrScheme>',
    '    <a:fontScheme name="SlideForge">',
    '      <a:majorFont>',
    '        <a:latin typeface="Calibri"/>',
    '        <a:ea typeface=""/>',
    '        <a:cs typeface=""/>',
    '      </a:majorFont>',
    '      <a:minorFont>',
    '        <a:latin typeface="Calibri"/>',
    '        <a:ea typeface=""/>',
    '        <a:cs typeface=""/>',
    '      </a:minorFont>',
    '    </a:fontScheme>',
    '    <a:fmtScheme name="SlideForge">',
    '      <a:fillStyleLst>',
    '        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>',
    '        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>',
    '        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>',
    '      </a:fillStyleLst>',
    '      <a:lnStyleLst>',
    '        <a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>',
    '        <a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>',
    '        <a:ln w="38100"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>',
    '      </a:lnStyleLst>',
    '      <a:effectStyleLst>',
    '        <a:effectStyle><a:effectLst/></a:effectStyle>',
    '        <a:effectStyle><a:effectLst/></a:effectStyle>',
    '        <a:effectStyle><a:effectLst/></a:effectStyle>',
    '      </a:effectStyleLst>',
    '      <a:bgFillStyleLst>',
    '        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>',
    '        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>',
    '        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>',
    '      </a:bgFillStyleLst>',
    '    </a:fmtScheme>',
    '  </a:themeElements>',
    '  <a:objectDefaults/>',
    '  <a:extraClrSchemeLst/>',
    '</a:theme>',
  ].join('\n');
}

// ─── Slide Master ────────────────────────────────────────────────────

/**
 * Build a minimal slideMaster1.xml.
 *
 * References slideLayout1 via rId1 and includes empty required elements.
 */
export function buildSlideMaster(): string {
  return [
    xmlDeclaration(),
    '<p:sldMaster',
    '  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
    '  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    '  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">',
    '  <p:cSld>',
    '    <p:bg>',
    '      <p:bgPr>',
    '        <a:solidFill><a:schemeClr val="bg1"/></a:solidFill>',
    '        <a:effectLst/>',
    '      </p:bgPr>',
    '    </p:bg>',
    '    <p:spTree>',
    '      <p:nvGrpSpPr>',
    '        <p:cNvPr id="1" name=""/>',
    '        <p:cNvGrpSpPr/>',
    '        <p:nvPr/>',
    '      </p:nvGrpSpPr>',
    '      <p:grpSpPr>',
    '        <a:xfrm>',
    '          <a:off x="0" y="0"/>',
    '          <a:ext cx="0" cy="0"/>',
    '          <a:chOff x="0" y="0"/>',
    '          <a:chExt cx="0" cy="0"/>',
    '        </a:xfrm>',
    '      </p:grpSpPr>',
    '    </p:spTree>',
    '  </p:cSld>',
    '  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2"',
    '    accent1="accent1" accent2="accent2" accent3="accent3"',
    '    accent4="accent4" accent5="accent5" accent6="accent6"',
    '    hlink="hlink" folHlink="folHlink"/>',
    '  <p:sldLayoutIdLst>',
    '    <p:sldLayoutId id="2147483649" r:id="rId1"/>',
    '  </p:sldLayoutIdLst>',
    '</p:sldMaster>',
  ].join('\n');
}

// ─── Slide Layout ────────────────────────────────────────────────────

/**
 * Build a minimal slideLayout1.xml (blank layout).
 *
 * References slideMaster1 via rId1.
 */
export function buildSlideLayout(): string {
  return [
    xmlDeclaration(),
    '<p:sldLayout',
    '  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"',
    '  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"',
    '  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"',
    '  type="blank" preserve="1">',
    '  <p:cSld name="Blank">',
    '    <p:spTree>',
    '      <p:nvGrpSpPr>',
    '        <p:cNvPr id="1" name=""/>',
    '        <p:cNvGrpSpPr/>',
    '        <p:nvPr/>',
    '      </p:nvGrpSpPr>',
    '      <p:grpSpPr>',
    '        <a:xfrm>',
    '          <a:off x="0" y="0"/>',
    '          <a:ext cx="0" cy="0"/>',
    '          <a:chOff x="0" y="0"/>',
    '          <a:chExt cx="0" cy="0"/>',
    '        </a:xfrm>',
    '      </p:grpSpPr>',
    '    </p:spTree>',
    '  </p:cSld>',
    '  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>',
    '</p:sldLayout>',
  ].join('\n');
}

// ─── Relationship Files ──────────────────────────────────────────────

const RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const SLIDE_LAYOUT_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout';
const SLIDE_MASTER_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster';
const THEME_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme';

/**
 * Build ppt/slideMasters/_rels/slideMaster1.xml.rels.
 *
 * Links to slideLayout1.xml and theme1.xml.
 */
export function buildSlideMasterRels(): string {
  return [
    xmlDeclaration(),
    `<Relationships xmlns="${RELS_NS}">`,
    `  <Relationship Id="rId1" Type="${SLIDE_LAYOUT_REL}" Target="../slideLayouts/slideLayout1.xml"/>`,
    `  <Relationship Id="rId2" Type="${THEME_REL}" Target="../theme/theme1.xml"/>`,
    '</Relationships>',
  ].join('\n');
}

/**
 * Build ppt/slideLayouts/_rels/slideLayout1.xml.rels.
 *
 * Links back to slideMaster1.xml.
 */
export function buildSlideLayoutRels(): string {
  return [
    xmlDeclaration(),
    `<Relationships xmlns="${RELS_NS}">`,
    `  <Relationship Id="rId1" Type="${SLIDE_MASTER_REL}" Target="../slideMasters/slideMaster1.xml"/>`,
    '</Relationships>',
  ].join('\n');
}
