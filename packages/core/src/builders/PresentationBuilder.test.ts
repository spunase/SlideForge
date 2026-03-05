import { buildPresentation } from './PresentationBuilder';

describe('buildPresentation', () => {
  it('should start with XML declaration', () => {
    const xml = buildPresentation(1, 12192000, 6858000);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  });

  it('should contain p:presentation root element', () => {
    const xml = buildPresentation(1, 12192000, 6858000);
    expect(xml).toContain('<p:presentation');
    expect(xml).toContain('</p:presentation>');
  });

  it('should contain correct namespaces', () => {
    const xml = buildPresentation(1, 12192000, 6858000);
    expect(xml).toContain('xmlns:a=');
    expect(xml).toContain('xmlns:r=');
    expect(xml).toContain('xmlns:p=');
  });

  it('should contain slide master ID list', () => {
    const xml = buildPresentation(1, 12192000, 6858000);
    expect(xml).toContain('<p:sldMasterIdLst>');
    expect(xml).toContain('<p:sldMasterId');
  });

  it('should reference slide master with rId after all slides', () => {
    const xml = buildPresentation(2, 12192000, 6858000);
    // For 2 slides, slide master should be rId3
    expect(xml).toContain('r:id="rId3"');
  });

  it('should contain slide ID list with correct IDs', () => {
    const xml = buildPresentation(2, 12192000, 6858000);
    expect(xml).toContain('<p:sldIdLst>');
    expect(xml).toContain('id="256"'); // 255 + 1
    expect(xml).toContain('id="257"'); // 255 + 2
  });

  it('should reference each slide with sequential rIds', () => {
    const xml = buildPresentation(3, 12192000, 6858000);
    expect(xml).toContain('r:id="rId1"');
    expect(xml).toContain('r:id="rId2"');
    expect(xml).toContain('r:id="rId3"');
  });

  it('should contain slide size with provided dimensions', () => {
    const xml = buildPresentation(1, 12192000, 6858000);
    expect(xml).toContain('cx="12192000"');
    expect(xml).toContain('cy="6858000"');
  });

  it('should contain notes size matching slide dimensions', () => {
    const xml = buildPresentation(1, 12192000, 6858000);
    expect(xml).toContain('<p:notesSz');
  });

  it('should produce empty slide list for slideCount=0', () => {
    const xml = buildPresentation(0, 12192000, 6858000);
    expect(xml).toContain('<p:sldIdLst>');
    expect(xml).toContain('</p:sldIdLst>');
    // Should not contain any <p:sldId ... r:id="rIdN"/> entries (slide refs)
    expect(xml).not.toMatch(/<p:sldId id="\d+" r:id="/);
  });

  it('should set type to "custom"', () => {
    const xml = buildPresentation(1, 12192000, 6858000);
    expect(xml).toContain('type="custom"');
  });
});
