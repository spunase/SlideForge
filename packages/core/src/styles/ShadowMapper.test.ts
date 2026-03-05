import { mapShadow } from './ShadowMapper';

describe('mapShadow', () => {
  it('should return null shadow for empty input', () => {
    const { shadow } = mapShadow({});
    expect(shadow).toBeNull();
  });

  it('should return null shadow for "none"', () => {
    const { shadow } = mapShadow({ 'box-shadow': 'none' });
    expect(shadow).toBeNull();
  });

  it('should return null shadow for empty string', () => {
    const { shadow } = mapShadow({ 'box-shadow': '' });
    expect(shadow).toBeNull();
  });

  it('should parse basic shadow with offsets and blur', () => {
    const { shadow } = mapShadow({ 'box-shadow': '2px 4px 6px #000000' });
    expect(shadow).not.toBeNull();
    expect(shadow!.offsetX).toBe(2);
    expect(shadow!.offsetY).toBe(4);
    expect(shadow!.blur).toBe(6);
  });

  it('should parse shadow with rgba color at start', () => {
    const { shadow } = mapShadow({ 'box-shadow': 'rgba(0, 0, 0, 0.5) 2px 4px 8px' });
    expect(shadow).not.toBeNull();
    expect(shadow!.offsetX).toBe(2);
    expect(shadow!.offsetY).toBe(4);
    expect(shadow!.blur).toBe(8);
    expect(shadow!.alpha).toBe(0.5);
  });

  it('should parse shadow with color at end', () => {
    const { shadow } = mapShadow({ 'box-shadow': '2px 4px 6px rgba(255, 0, 0, 0.8)' });
    expect(shadow).not.toBeNull();
    expect(shadow!.color).toBe('FF0000');
    expect(shadow!.alpha).toBe(0.8);
  });

  it('should parse shadow with spread value', () => {
    const { shadow } = mapShadow({ 'box-shadow': '2px 4px 6px 3px #000000' });
    expect(shadow).not.toBeNull();
    expect(shadow!.spread).toBe(3);
  });

  it('should warn about spread being ignored', () => {
    const { warnings } = mapShadow({ 'box-shadow': '2px 4px 6px 3px #000000' });
    expect(warnings.some(w => w.message.includes('spread'))).toBe(true);
  });

  it('should warn about inset shadow', () => {
    const { warnings } = mapShadow({ 'box-shadow': 'inset 2px 4px 6px #000000' });
    expect(warnings.some(w => w.message.includes('Inset'))).toBe(true);
  });

  it('should warn about multiple shadows and use only the first', () => {
    const { shadow, warnings } = mapShadow({
      'box-shadow': '2px 4px 6px #000000, 4px 8px 12px #ff0000',
    });
    expect(shadow).not.toBeNull();
    expect(shadow!.offsetX).toBe(2);
    expect(warnings.some(w => w.message.includes('Multiple'))).toBe(true);
  });

  it('should parse shadow with two offsets and named color', () => {
    const { shadow } = mapShadow({ 'box-shadow': '5px 10px black' });
    expect(shadow).not.toBeNull();
    expect(shadow!.offsetX).toBe(5);
    expect(shadow!.offsetY).toBe(10);
    expect(shadow!.blur).toBe(0);
  });

  it('should default to black color when no color is provided', () => {
    const { shadow } = mapShadow({ 'box-shadow': '2px 4px 6px' });
    expect(shadow).not.toBeNull();
    expect(shadow!.color).toBe('000000');
  });
});
