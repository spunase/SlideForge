import { mapPosition } from './PositionMapper';

describe('mapPosition', () => {
  const slideWidth = 1920;
  const slideHeight = 1080;

  it('should pass through geometry within bounds unchanged', () => {
    const result = mapPosition(
      { x: 100, y: 200, width: 300, height: 400, zIndex: 1 },
      slideWidth,
      slideHeight
    );
    expect(result).toEqual({ x: 100, y: 200, width: 300, height: 400, zIndex: 1 });
  });

  it('should clip element extending past the right edge', () => {
    const result = mapPosition(
      { x: 1800, y: 100, width: 300, height: 200, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.x).toBe(1800);
    expect(result.width).toBe(120); // 1920 - 1800
  });

  it('should clip element extending past the bottom edge', () => {
    const result = mapPosition(
      { x: 100, y: 900, width: 200, height: 300, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.y).toBe(900);
    expect(result.height).toBe(180); // 1080 - 900
  });

  it('should handle negative X by shifting to 0 and reducing width', () => {
    const result = mapPosition(
      { x: -50, y: 100, width: 200, height: 100, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.x).toBe(0);
    expect(result.width).toBe(150); // 200 + (-50) = 150
  });

  it('should handle negative Y by shifting to 0 and reducing height', () => {
    const result = mapPosition(
      { x: 100, y: -30, width: 200, height: 100, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.y).toBe(0);
    expect(result.height).toBe(70); // 100 + (-30) = 70
  });

  it('should place completely off-screen element at origin with zero size', () => {
    const result = mapPosition(
      { x: 2000, y: 100, width: 200, height: 100, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('should place element off-screen below at origin with zero size', () => {
    const result = mapPosition(
      { x: 100, y: 1200, width: 200, height: 100, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('should ensure non-negative dimensions for negative width', () => {
    const result = mapPosition(
      { x: 100, y: 100, width: -50, height: -30, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
  });

  it('should preserve zIndex', () => {
    const result = mapPosition(
      { x: 100, y: 100, width: 200, height: 200, zIndex: 42 },
      slideWidth,
      slideHeight
    );
    expect(result.zIndex).toBe(42);
  });

  it('should handle element at exact slide boundaries', () => {
    const result = mapPosition(
      { x: 0, y: 0, width: 1920, height: 1080, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it('should handle negative position that eliminates all width', () => {
    const result = mapPosition(
      { x: -300, y: 100, width: 200, height: 100, zIndex: 0 },
      slideWidth,
      slideHeight
    );
    expect(result.x).toBe(0);
    expect(result.width).toBe(0); // 200 + (-300) clamped to 0
  });
});
