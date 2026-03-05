import { mapBackground } from './BackgroundMapper';

describe('mapBackground', () => {
  it('should return none fill for empty computed styles', () => {
    const { fill } = mapBackground({});
    expect(fill.type).toBe('none');
  });

  it('should parse solid background-color', () => {
    const { fill } = mapBackground({ 'background-color': 'rgb(255, 0, 0)' });
    expect(fill.type).toBe('solid');
    expect(fill.color).toBe('FF0000');
  });

  it('should parse hex background-color', () => {
    const { fill } = mapBackground({ 'background-color': '#00ff00' });
    expect(fill.type).toBe('solid');
    expect(fill.color).toBe('00FF00');
  });

  it('should return none fill for "transparent"', () => {
    const { fill } = mapBackground({ 'background-color': 'transparent' });
    expect(fill.type).toBe('none');
  });

  it('should return none fill for "none"', () => {
    const { fill } = mapBackground({ 'background-color': 'none' });
    expect(fill.type).toBe('none');
  });

  it('should return none fill for "initial"', () => {
    const { fill } = mapBackground({ 'background-color': 'initial' });
    expect(fill.type).toBe('none');
  });

  it('should return none fill for "inherit"', () => {
    const { fill } = mapBackground({ 'background-color': 'inherit' });
    expect(fill.type).toBe('none');
  });

  it('should return none fill for rgba(0,0,0,0)', () => {
    const { fill } = mapBackground({ 'background-color': 'rgba(0, 0, 0, 0)' });
    expect(fill.type).toBe('none');
  });

  it('should return none fill for rgba(0,0,0,0) without spaces', () => {
    const { fill } = mapBackground({ 'background-color': 'rgba(0,0,0,0)' });
    expect(fill.type).toBe('none');
  });

  it('should warn when background-image has url()', () => {
    const { warnings } = mapBackground({
      'background-image': 'url(image.png)',
      'background-color': '#ff0000',
    });
    expect(warnings.some(w => w.code === 'SF-CSS-002')).toBe(true);
  });

  it('should still parse background-color when background-image has url()', () => {
    const { fill } = mapBackground({
      'background-image': 'url(image.png)',
      'background-color': '#ff0000',
    });
    expect(fill.type).toBe('solid');
    expect(fill.color).toBe('FF0000');
  });

  it('should extract alpha for semi-transparent colors', () => {
    const { fill } = mapBackground({ 'background-color': 'rgba(255, 0, 0, 0.5)' });
    expect(fill.type).toBe('solid');
    expect(fill.alpha).toBe(0.5);
  });

  it('should return no warnings for simple solid color', () => {
    const { warnings } = mapBackground({ 'background-color': '#ff0000' });
    expect(warnings).toHaveLength(0);
  });
});
