import { escapeXml, xmlDeclaration } from './xml';

describe('escapeXml', () => {
  it('should escape ampersand', () => {
    expect(escapeXml('a&b')).toBe('a&amp;b');
  });

  it('should escape less-than', () => {
    expect(escapeXml('a<b')).toBe('a&lt;b');
  });

  it('should escape greater-than', () => {
    expect(escapeXml('a>b')).toBe('a&gt;b');
  });

  it('should escape double quote', () => {
    expect(escapeXml('a"b')).toBe('a&quot;b');
  });

  it('should escape single quote (apostrophe)', () => {
    expect(escapeXml("a'b")).toBe('a&apos;b');
  });

  it('should escape all five entities in one string', () => {
    expect(escapeXml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  it('should return empty string for empty input', () => {
    expect(escapeXml('')).toBe('');
  });

  it('should leave plain text unchanged', () => {
    expect(escapeXml('Hello World')).toBe('Hello World');
  });

  it('should handle multiple occurrences of same entity', () => {
    expect(escapeXml('a&&b')).toBe('a&amp;&amp;b');
  });
});

describe('xmlDeclaration', () => {
  it('should return a valid XML declaration', () => {
    const decl = xmlDeclaration();
    expect(decl).toBe('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  });

  it('should start with <?xml', () => {
    expect(xmlDeclaration().startsWith('<?xml')).toBe(true);
  });

  it('should end with ?>', () => {
    expect(xmlDeclaration().endsWith('?>')).toBe(true);
  });
});
