import { parseColor, colorToSrgbClr } from './color';

describe('parseColor', () => {
  describe('hex colors', () => {
    it('should parse 6-digit hex', () => {
      const result = parseColor('#FF00AA');
      expect(result.hex).toBe('FF00AA');
      expect(result.alpha).toBe(1);
    });

    it('should parse 3-digit hex and expand it', () => {
      const result = parseColor('#F0A');
      expect(result.hex).toBe('FF00AA');
      expect(result.alpha).toBe(1);
    });

    it('should parse 8-digit hex with alpha', () => {
      const result = parseColor('#FF00AA80');
      expect(result.hex).toBe('FF00AA');
      expect(result.alpha).toBeCloseTo(128 / 255, 2);
    });

    it('should parse 4-digit hex with alpha', () => {
      const result = parseColor('#F0A8');
      expect(result.hex).toBe('FF00AA');
      // alpha from expanded '88' => 0x88 / 255
      expect(result.alpha).toBeCloseTo(0x88 / 255, 2);
    });

    it('should be case-insensitive', () => {
      const result = parseColor('#ff00aa');
      expect(result.hex).toBe('FF00AA');
    });
  });

  describe('rgb/rgba colors', () => {
    it('should parse rgb(r, g, b)', () => {
      const result = parseColor('rgb(255, 0, 128)');
      expect(result.hex).toBe('FF0080');
      expect(result.alpha).toBe(1);
    });

    it('should parse rgba(r, g, b, a)', () => {
      const result = parseColor('rgba(255, 0, 128, 0.5)');
      expect(result.hex).toBe('FF0080');
      expect(result.alpha).toBe(0.5);
    });

    it('should clamp rgb values above 255', () => {
      const result = parseColor('rgb(300, 0, 0)');
      expect(result.hex).toBe('FF0000');
    });

    it('should clamp alpha to [0, 1]', () => {
      const result = parseColor('rgba(0, 0, 0, 2)');
      expect(result.alpha).toBe(1);
    });

    it('should handle rgba with alpha 0', () => {
      const result = parseColor('rgba(0, 0, 0, 0)');
      expect(result.alpha).toBe(0);
    });
  });

  describe('named colors', () => {
    it('should parse "black"', () => {
      const result = parseColor('black');
      expect(result.hex).toBe('000000');
      expect(result.alpha).toBe(1);
    });

    it('should parse "white"', () => {
      const result = parseColor('white');
      expect(result.hex).toBe('FFFFFF');
      expect(result.alpha).toBe(1);
    });

    it('should parse "red"', () => {
      const result = parseColor('red');
      expect(result.hex).toBe('FF0000');
    });

    it('should parse "transparent" with alpha 0', () => {
      const result = parseColor('transparent');
      expect(result.hex).toBe('000000');
      expect(result.alpha).toBe(0);
    });

    it('should be case-insensitive for named colors', () => {
      const result = parseColor('RED');
      expect(result.hex).toBe('FF0000');
    });

    it('should handle whitespace around named colors', () => {
      const result = parseColor('  blue  ');
      expect(result.hex).toBe('0000FF');
    });
  });

  describe('error handling', () => {
    it('should throw for unrecognized color string', () => {
      expect(() => parseColor('notacolor')).toThrow('Unable to parse color');
    });

    it('should throw for empty string', () => {
      expect(() => parseColor('')).toThrow('Unable to parse color');
    });
  });
});

describe('colorToSrgbClr', () => {
  it('should generate self-closing element for fully opaque color', () => {
    const xml = colorToSrgbClr('FF0000');
    expect(xml).toBe('<a:srgbClr val="FF0000"/>');
  });

  it('should generate self-closing element when alpha is 1', () => {
    const xml = colorToSrgbClr('00FF00', 1);
    expect(xml).toBe('<a:srgbClr val="00FF00"/>');
  });

  it('should include alpha child element when alpha < 1', () => {
    const xml = colorToSrgbClr('0000FF', 0.5);
    expect(xml).toContain('<a:srgbClr val="0000FF">');
    expect(xml).toContain('<a:alpha val="50000"/>');
    expect(xml).toContain('</a:srgbClr>');
  });

  it('should handle alpha of 0', () => {
    const xml = colorToSrgbClr('000000', 0);
    expect(xml).toContain('<a:alpha val="0"/>');
  });

  it('should strip leading # from hex if present', () => {
    const xml = colorToSrgbClr('#FF0000');
    expect(xml).toBe('<a:srgbClr val="FF0000"/>');
  });

  it('should uppercase the hex value', () => {
    const xml = colorToSrgbClr('ff0000');
    expect(xml).toBe('<a:srgbClr val="FF0000"/>');
  });

  it('should generate no alpha child when alpha is undefined', () => {
    const xml = colorToSrgbClr('AABBCC');
    expect(xml).not.toContain('a:alpha');
  });
});
