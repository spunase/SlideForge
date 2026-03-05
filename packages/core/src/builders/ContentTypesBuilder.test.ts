import { buildContentTypes } from './ContentTypesBuilder';

describe('buildContentTypes', () => {
  it('should start with XML declaration', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  });

  it('should contain Types root element', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('<Types xmlns=');
    expect(xml).toContain('</Types>');
  });

  it('should contain default extension for rels', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('Extension="rels"');
  });

  it('should contain default extension for xml', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('Extension="xml"');
  });

  it('should contain default extension for png', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('Extension="png"');
  });

  it('should contain default extension for jpeg', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('Extension="jpeg"');
  });

  it('should contain override for presentation.xml', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('PartName="/ppt/presentation.xml"');
  });

  it('should contain override for theme', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('PartName="/ppt/theme/theme1.xml"');
  });

  it('should contain override for slide master', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('PartName="/ppt/slideMasters/slideMaster1.xml"');
  });

  it('should contain override for slide layout', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('PartName="/ppt/slideLayouts/slideLayout1.xml"');
  });

  it('should produce one slide override for slideCount=1', () => {
    const xml = buildContentTypes(1, 0);
    expect(xml).toContain('PartName="/ppt/slides/slide1.xml"');
    expect(xml).not.toContain('PartName="/ppt/slides/slide2.xml"');
  });

  it('should produce overrides for all slides when slideCount=3', () => {
    const xml = buildContentTypes(3, 0);
    expect(xml).toContain('PartName="/ppt/slides/slide1.xml"');
    expect(xml).toContain('PartName="/ppt/slides/slide2.xml"');
    expect(xml).toContain('PartName="/ppt/slides/slide3.xml"');
    expect(xml).not.toContain('PartName="/ppt/slides/slide4.xml"');
  });

  it('should produce no slide overrides for slideCount=0', () => {
    const xml = buildContentTypes(0, 0);
    expect(xml).not.toContain('PartName="/ppt/slides/slide');
  });
});
