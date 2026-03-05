import { mapTextStyle } from './TextStyleMapper';

describe('mapTextStyle', () => {
  it('should return default values for empty computed styles', () => {
    const { textStyle } = mapTextStyle({});
    expect(textStyle.fontSize).toBe(16);
    expect(textStyle.fontWeight).toBe('normal');
    expect(textStyle.fontStyle).toBe('normal');
    expect(textStyle.textDecoration).toBe('none');
    expect(textStyle.textAlign).toBe('left');
    expect(textStyle.lineHeight).toBe(1.2);
    expect(textStyle.letterSpacing).toBe(0);
  });

  describe('font-size parsing', () => {
    it('should parse px value', () => {
      const { textStyle } = mapTextStyle({ 'font-size': '24px' });
      expect(textStyle.fontSize).toBe(24);
    });

    it('should parse pt value and convert to px', () => {
      const { textStyle } = mapTextStyle({ 'font-size': '12pt' });
      expect(textStyle.fontSize).toBeCloseTo(12 * 1.333, 1);
    });

    it('should parse em value with warning', () => {
      const { textStyle, warnings } = mapTextStyle({ 'font-size': '2em' });
      expect(textStyle.fontSize).toBe(32);
      expect(warnings.some(w => w.code === 'SF-CSS-001')).toBe(true);
    });

    it('should parse rem value with warning', () => {
      const { textStyle, warnings } = mapTextStyle({ 'font-size': '1.5rem' });
      expect(textStyle.fontSize).toBe(24);
      expect(warnings.some(w => w.code === 'SF-CSS-001')).toBe(true);
    });

    it('should handle keyword "medium" as 16px', () => {
      const { textStyle } = mapTextStyle({ 'font-size': 'medium' });
      expect(textStyle.fontSize).toBe(16);
    });

    it('should enforce minimum font size of 1', () => {
      const { textStyle } = mapTextStyle({ 'font-size': '0px' });
      expect(textStyle.fontSize).toBeGreaterThanOrEqual(1);
    });
  });

  describe('font-weight parsing', () => {
    it('should parse "bold" as bold', () => {
      const { textStyle } = mapTextStyle({ 'font-weight': 'bold' });
      expect(textStyle.fontWeight).toBe('bold');
    });

    it('should parse "700" as bold', () => {
      const { textStyle } = mapTextStyle({ 'font-weight': '700' });
      expect(textStyle.fontWeight).toBe('bold');
    });

    it('should parse "400" as normal', () => {
      const { textStyle } = mapTextStyle({ 'font-weight': '400' });
      expect(textStyle.fontWeight).toBe('normal');
    });

    it('should parse "bolder" as bold', () => {
      const { textStyle } = mapTextStyle({ 'font-weight': 'bolder' });
      expect(textStyle.fontWeight).toBe('bold');
    });
  });

  describe('font-style parsing', () => {
    it('should parse "italic"', () => {
      const { textStyle } = mapTextStyle({ 'font-style': 'italic' });
      expect(textStyle.fontStyle).toBe('italic');
    });

    it('should parse "oblique" as italic', () => {
      const { textStyle } = mapTextStyle({ 'font-style': 'oblique' });
      expect(textStyle.fontStyle).toBe('italic');
    });

    it('should parse "normal"', () => {
      const { textStyle } = mapTextStyle({ 'font-style': 'normal' });
      expect(textStyle.fontStyle).toBe('normal');
    });
  });

  describe('text-decoration parsing', () => {
    it('should parse "underline"', () => {
      const { textStyle } = mapTextStyle({ 'text-decoration': 'underline' });
      expect(textStyle.textDecoration).toBe('underline');
    });

    it('should parse "line-through"', () => {
      const { textStyle } = mapTextStyle({ 'text-decoration': 'line-through' });
      expect(textStyle.textDecoration).toBe('line-through');
    });

    it('should parse "none"', () => {
      const { textStyle } = mapTextStyle({ 'text-decoration': 'none' });
      expect(textStyle.textDecoration).toBe('none');
    });

    it('should detect underline in compound value', () => {
      const { textStyle } = mapTextStyle({ 'text-decoration': 'underline solid red' });
      expect(textStyle.textDecoration).toBe('underline');
    });
  });

  describe('text-align parsing', () => {
    it('should parse "center"', () => {
      const { textStyle } = mapTextStyle({ 'text-align': 'center' });
      expect(textStyle.textAlign).toBe('center');
    });

    it('should parse "right"', () => {
      const { textStyle } = mapTextStyle({ 'text-align': 'right' });
      expect(textStyle.textAlign).toBe('right');
    });

    it('should parse "justify"', () => {
      const { textStyle } = mapTextStyle({ 'text-align': 'justify' });
      expect(textStyle.textAlign).toBe('justify');
    });

    it('should parse "start" as left', () => {
      const { textStyle } = mapTextStyle({ 'text-align': 'start' });
      expect(textStyle.textAlign).toBe('left');
    });

    it('should parse "end" as right', () => {
      const { textStyle } = mapTextStyle({ 'text-align': 'end' });
      expect(textStyle.textAlign).toBe('right');
    });
  });

  describe('line-height parsing', () => {
    it('should parse "normal" as 1.2', () => {
      const { textStyle } = mapTextStyle({ 'line-height': 'normal' });
      expect(textStyle.lineHeight).toBe(1.2);
    });

    it('should parse unitless ratio', () => {
      const { textStyle } = mapTextStyle({ 'line-height': '1.5' });
      expect(textStyle.lineHeight).toBe(1.5);
    });

    it('should parse px value relative to font size', () => {
      const { textStyle } = mapTextStyle({
        'font-size': '16px',
        'line-height': '24px',
      });
      expect(textStyle.lineHeight).toBe(1.5);
    });

    it('should parse percentage value', () => {
      const { textStyle } = mapTextStyle({ 'line-height': '150%' });
      expect(textStyle.lineHeight).toBe(1.5);
    });
  });

  describe('letter-spacing parsing', () => {
    it('should parse "normal" as 0', () => {
      const { textStyle } = mapTextStyle({ 'letter-spacing': 'normal' });
      expect(textStyle.letterSpacing).toBe(0);
    });

    it('should parse px value', () => {
      const { textStyle } = mapTextStyle({ 'letter-spacing': '2px' });
      expect(textStyle.letterSpacing).toBe(2);
    });

    it('should handle negative letter-spacing', () => {
      const { textStyle } = mapTextStyle({ 'letter-spacing': '-0.5px' });
      expect(textStyle.letterSpacing).toBe(-0.5);
    });
  });

  describe('font substitution warning', () => {
    it('should produce a warning when font is substituted', () => {
      const { warnings } = mapTextStyle({ 'font-family': 'Inter' });
      expect(warnings.some(w => w.code === 'SF-ASSET-002')).toBe(true);
    });

    it('should not produce a warning for PPTX-safe fonts', () => {
      const { warnings } = mapTextStyle({ 'font-family': 'Arial' });
      expect(warnings.some(w => w.code === 'SF-ASSET-002')).toBe(false);
    });
  });
});
