import { mapFont } from './FontMapper';

describe('mapFont', () => {
  it('should return Arial as fallback for empty input', () => {
    const result = mapFont('');
    expect(result.mapped).toBe('Arial');
    expect(result.substitution).not.toBeNull();
  });

  it('should return PPTX-safe font without substitution', () => {
    const result = mapFont('Arial');
    expect(result.mapped).toBe('Arial');
    expect(result.substitution).toBeNull();
  });

  it('should return Calibri without substitution', () => {
    const result = mapFont('Calibri');
    expect(result.mapped).toBe('Calibri');
    expect(result.substitution).toBeNull();
  });

  it('should map Inter to Arial with substitution', () => {
    const result = mapFont('Inter');
    expect(result.mapped).toBe('Arial');
    expect(result.substitution).toEqual({
      original: 'Inter',
      replacement: 'Arial',
    });
  });

  it('should map Roboto to Calibri', () => {
    const result = mapFont('Roboto');
    expect(result.mapped).toBe('Calibri');
  });

  it('should map Helvetica to Arial', () => {
    const result = mapFont('Helvetica');
    expect(result.mapped).toBe('Arial');
  });

  it('should map monospace generic to Consolas', () => {
    const result = mapFont('monospace');
    expect(result.mapped).toBe('Consolas');
  });

  it('should map sans-serif generic to Arial', () => {
    const result = mapFont('sans-serif');
    expect(result.mapped).toBe('Arial');
  });

  it('should map serif generic to Times New Roman', () => {
    const result = mapFont('serif');
    expect(result.mapped).toBe('Times New Roman');
  });

  it('should handle font stack and pick first match', () => {
    const result = mapFont('"Inter", "Arial", sans-serif');
    // Inter maps to Arial via fallback table
    expect(result.mapped).toBe('Arial');
  });

  it('should handle font stack where first font is PPTX-safe', () => {
    const result = mapFont('"Verdana", "Arial", sans-serif');
    expect(result.mapped).toBe('Verdana');
    expect(result.substitution).toBeNull();
  });

  it('should strip quotes from font names', () => {
    const result = mapFont("'Arial'");
    expect(result.mapped).toBe('Arial');
    expect(result.substitution).toBeNull();
  });

  it('should fall back to Arial for unknown fonts', () => {
    const result = mapFont('SomeCustomFont');
    expect(result.mapped).toBe('Arial');
    expect(result.substitution).not.toBeNull();
  });

  it('should map Fira Code to Consolas', () => {
    const result = mapFont('Fira Code');
    expect(result.mapped).toBe('Consolas');
  });

  it('should map system-ui to Segoe UI', () => {
    const result = mapFont('system-ui');
    expect(result.mapped).toBe('Segoe UI');
  });
});
