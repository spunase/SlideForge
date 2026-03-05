import { mapBorder } from './BorderMapper';

describe('mapBorder', () => {
  it('should return zero-width none border for empty styles', () => {
    const { border } = mapBorder({});
    expect(border.width).toBe(0);
    expect(border.style).toBe('none');
  });

  it('should parse solid border with width and color', () => {
    const { border } = mapBorder({
      'border-width': '2px',
      'border-style': 'solid',
      'border-color': '#ff0000',
    });
    expect(border.width).toBe(2);
    expect(border.style).toBe('solid');
    expect(border.color).toBe('FF0000');
  });

  it('should parse dashed border style', () => {
    const { border } = mapBorder({
      'border-width': '1px',
      'border-style': 'dashed',
    });
    expect(border.style).toBe('dashed');
  });

  it('should parse dotted border style', () => {
    const { border } = mapBorder({
      'border-width': '1px',
      'border-style': 'dotted',
    });
    expect(border.style).toBe('dotted');
  });

  it('should approximate "double" as solid', () => {
    const { border } = mapBorder({
      'border-width': '3px',
      'border-style': 'double',
    });
    expect(border.style).toBe('solid');
  });

  it('should approximate "groove" as solid', () => {
    const { border } = mapBorder({
      'border-width': '3px',
      'border-style': 'groove',
    });
    expect(border.style).toBe('solid');
  });

  it('should return none for hidden border style', () => {
    const { border } = mapBorder({
      'border-width': '1px',
      'border-style': 'hidden',
    });
    expect(border.width).toBe(0);
    expect(border.style).toBe('none');
  });

  it('should fall back to border-top-width if border-width is absent', () => {
    const { border } = mapBorder({
      'border-top-width': '4px',
      'border-style': 'solid',
    });
    expect(border.width).toBe(4);
  });

  it('should fall back to border-top-color if border-color is absent', () => {
    const { border } = mapBorder({
      'border-width': '1px',
      'border-style': 'solid',
      'border-top-color': '#00ff00',
    });
    expect(border.color).toBe('00FF00');
  });

  it('should default color to 000000 if no color is provided', () => {
    const { border } = mapBorder({
      'border-width': '1px',
      'border-style': 'solid',
    });
    expect(border.color).toBe('000000');
  });

  describe('border-radius', () => {
    it('should return undefined radius for 0px', () => {
      const { border } = mapBorder({
        'border-width': '1px',
        'border-style': 'solid',
        'border-radius': '0px',
      });
      expect(border.radius).toBeUndefined();
    });

    it('should parse single uniform radius', () => {
      const { border, warnings } = mapBorder({
        'border-width': '1px',
        'border-style': 'solid',
        'border-radius': '8px',
      });
      expect(border.radius).toBe(8);
      expect(warnings.some(w => w.code === 'SF-CSS-001')).toBe(true);
    });

    it('should warn about non-uniform radius (multiple values)', () => {
      const { border, warnings } = mapBorder({
        'border-width': '1px',
        'border-style': 'solid',
        'border-radius': '8px 4px',
      });
      expect(border.radius).toBe(8);
      expect(
        warnings.some(w => w.message.includes('Non-uniform'))
      ).toBe(true);
    });

    it('should return undefined radius for empty string', () => {
      const { border } = mapBorder({
        'border-width': '1px',
        'border-style': 'solid',
        'border-radius': '',
      });
      expect(border.radius).toBeUndefined();
    });
  });

  describe('keyword border widths', () => {
    it('should parse "thin" as 1', () => {
      const { border } = mapBorder({
        'border-width': 'thin',
        'border-style': 'solid',
      });
      expect(border.width).toBe(1);
    });

    it('should parse "medium" as 3', () => {
      const { border } = mapBorder({
        'border-width': 'medium',
        'border-style': 'solid',
      });
      expect(border.width).toBe(3);
    });

    it('should parse "thick" as 5', () => {
      const { border } = mapBorder({
        'border-width': 'thick',
        'border-style': 'solid',
      });
      expect(border.width).toBe(5);
    });
  });
});
