import { classifyProperty } from './TierClassifier';

describe('classifyProperty', () => {
  describe('Tier A properties', () => {
    it('should classify "color" as A', () => {
      expect(classifyProperty('color', 'red')).toBe('A');
    });

    it('should classify "font-size" as A', () => {
      expect(classifyProperty('font-size', '16px')).toBe('A');
    });

    it('should classify "font-weight" as A', () => {
      expect(classifyProperty('font-weight', 'bold')).toBe('A');
    });

    it('should classify "background-color" as A', () => {
      expect(classifyProperty('background-color', '#ff0000')).toBe('A');
    });

    it('should classify "border-width" as A', () => {
      expect(classifyProperty('border-width', '2px')).toBe('A');
    });

    it('should classify "text-align" as A', () => {
      expect(classifyProperty('text-align', 'center')).toBe('A');
    });

    it('should classify "width" as A', () => {
      expect(classifyProperty('width', '100px')).toBe('A');
    });

    it('should classify "padding" as A', () => {
      expect(classifyProperty('padding', '10px')).toBe('A');
    });

    it('should classify "z-index" as A', () => {
      expect(classifyProperty('z-index', '1')).toBe('A');
    });
  });

  describe('Tier B properties', () => {
    it('should classify "box-shadow" as B', () => {
      expect(classifyProperty('box-shadow', '2px 4px 6px black')).toBe('B');
    });

    it('should classify "border-radius" as B', () => {
      expect(classifyProperty('border-radius', '8px')).toBe('B');
    });

    it('should classify "opacity" as B', () => {
      expect(classifyProperty('opacity', '0.5')).toBe('B');
    });

    it('should classify "text-transform" as B', () => {
      expect(classifyProperty('text-transform', 'uppercase')).toBe('B');
    });

    it('should classify "overflow" as B', () => {
      expect(classifyProperty('overflow', 'hidden')).toBe('B');
    });
  });

  describe('Tier C properties', () => {
    it('should classify "filter" as C', () => {
      expect(classifyProperty('filter', 'blur(5px)')).toBe('C');
    });

    it('should classify "animation" as C', () => {
      expect(classifyProperty('animation', 'fadeIn 1s')).toBe('C');
    });

    it('should classify "clip-path" as C', () => {
      expect(classifyProperty('clip-path', 'circle(50%)')).toBe('C');
    });

    it('should classify "cursor" as C', () => {
      expect(classifyProperty('cursor', 'pointer')).toBe('C');
    });

    it('should classify unknown property as C', () => {
      expect(classifyProperty('some-unknown-prop', 'value')).toBe('C');
    });
  });

  describe('special cases', () => {
    it('should classify background-image with linear-gradient as B', () => {
      expect(
        classifyProperty('background-image', 'linear-gradient(90deg, red, blue)')
      ).toBe('B');
    });

    it('should classify background-image with radial-gradient as C', () => {
      expect(
        classifyProperty('background-image', 'radial-gradient(circle, red, blue)')
      ).toBe('C');
    });

    it('should classify background-image with url() as B', () => {
      expect(
        classifyProperty('background-image', 'url(image.png)')
      ).toBe('B');
    });

    it('should classify display: grid as C', () => {
      expect(classifyProperty('display', 'grid')).toBe('C');
    });

    it('should classify display: flex as B', () => {
      expect(classifyProperty('display', 'flex')).toBe('B');
    });

    it('should classify display: block as A', () => {
      expect(classifyProperty('display', 'block')).toBe('A');
    });

    it('should classify flex-direction as B', () => {
      expect(classifyProperty('flex-direction', 'column')).toBe('B');
    });

    it('should classify grid-template-columns as C', () => {
      expect(classifyProperty('grid-template-columns', '1fr 1fr')).toBe('C');
    });

    it('should be case-insensitive for property names', () => {
      expect(classifyProperty('Color', 'red')).toBe('A');
    });
  });
});
