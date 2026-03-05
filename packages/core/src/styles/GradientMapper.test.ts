import { mapGradient } from './GradientMapper';

describe('mapGradient', () => {
  it('should return none fill for empty input', () => {
    const { fill } = mapGradient('');
    expect(fill.type).toBe('none');
  });

  it('should return none fill for undefined-like input', () => {
    const { fill } = mapGradient('   ');
    expect(fill.type).toBe('none');
  });

  describe('linear-gradient', () => {
    it('should parse simple two-color gradient', () => {
      const { fill } = mapGradient('linear-gradient(red, blue)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientStops).toHaveLength(2);
    });

    it('should parse gradient with angle', () => {
      const { fill } = mapGradient('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientAngle).toBe(90);
    });

    it('should default to 180deg (top to bottom) when no angle is given', () => {
      const { fill } = mapGradient('linear-gradient(#ff0000, #0000ff)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientAngle).toBe(180);
    });

    it('should parse gradient with "to right" direction', () => {
      const { fill } = mapGradient('linear-gradient(to right, red, blue)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientAngle).toBe(90);
    });

    it('should parse gradient with "to top" direction', () => {
      const { fill } = mapGradient('linear-gradient(to top, red, blue)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientAngle).toBe(0);
    });

    it('should parse gradient with "to bottom left" direction', () => {
      const { fill } = mapGradient('linear-gradient(to bottom left, red, blue)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientAngle).toBe(225);
    });

    it('should parse color stops with percentage positions', () => {
      const { fill } = mapGradient('linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientStops).toHaveLength(3);
      expect(fill.gradientStops![0]!.position).toBe(0);
      expect(fill.gradientStops![1]!.position).toBe(50);
      expect(fill.gradientStops![2]!.position).toBe(100);
    });

    it('should auto-calculate positions when none are specified', () => {
      const { fill } = mapGradient('linear-gradient(red, green, blue)');
      expect(fill.type).toBe('gradient');
      expect(fill.gradientStops).toHaveLength(3);
      expect(fill.gradientStops![0]!.position).toBe(0);
      expect(fill.gradientStops![1]!.position).toBe(50);
      expect(fill.gradientStops![2]!.position).toBe(100);
    });

    it('should produce a Tier B warning', () => {
      const { warnings } = mapGradient('linear-gradient(red, blue)');
      expect(warnings.some(w => w.code === 'SF-CSS-001')).toBe(true);
    });

    it('should fall back to solid if only one color stop', () => {
      const { fill } = mapGradient('linear-gradient(red)');
      expect(fill.type).toBe('solid');
    });
  });

  describe('radial-gradient', () => {
    it('should fall back to solid with first color', () => {
      const { fill } = mapGradient('radial-gradient(circle, red, blue)');
      expect(fill.type).toBe('solid');
    });

    it('should produce a Tier C warning', () => {
      const { warnings } = mapGradient('radial-gradient(circle, red, blue)');
      expect(warnings.some(w => w.code === 'SF-CSS-002')).toBe(true);
    });
  });

  describe('conic-gradient', () => {
    it('should fall back to solid with first color', () => {
      const { fill } = mapGradient('conic-gradient(red, blue)');
      expect(fill.type).toBe('solid');
    });

    it('should produce a Tier C warning', () => {
      const { warnings } = mapGradient('conic-gradient(red, blue)');
      expect(warnings.some(w => w.code === 'SF-CSS-002')).toBe(true);
    });

    it('should extract first color from conic-gradient with deg positions', () => {
      const { fill } = mapGradient(
        'conic-gradient(#3b82f6 0deg 263deg, #10b981 263deg 310deg, #f59e0b 310deg 360deg)'
      );
      expect(fill.type).toBe('solid');
      expect(fill.color).toBe('3B82F6');
    });

    it('should extract first color from conic-gradient with from keyword', () => {
      const { fill } = mapGradient(
        'conic-gradient(from 0deg, #ff0000 0deg 90deg, #00ff00 90deg 180deg)'
      );
      expect(fill.type).toBe('solid');
      expect(fill.color).toBe('FF0000');
    });
  });

  describe('unknown gradient types', () => {
    it('should return none for non-gradient string', () => {
      const { fill } = mapGradient('some-random-value');
      expect(fill.type).toBe('none');
    });
  });
});
