import { pxToEmu, ptToEmu, ptToHalfPt, SLIDE_16_9, SLIDE_4_3 } from './emu';

describe('emu utilities', () => {
  describe('SLIDE_16_9', () => {
    it('should have width of 12192000 EMU (10 inches)', () => {
      expect(SLIDE_16_9.width).toBe(12192000);
    });

    it('should have height of 6858000 EMU (5.625 inches)', () => {
      expect(SLIDE_16_9.height).toBe(6858000);
    });
  });

  describe('SLIDE_4_3', () => {
    it('should have width of 9144000 EMU (10 inches at 4:3)', () => {
      expect(SLIDE_4_3.width).toBe(9144000);
    });

    it('should have height of 6858000 EMU', () => {
      expect(SLIDE_4_3.height).toBe(6858000);
    });
  });

  describe('pxToEmu', () => {
    it('should convert 1 px to 9525 EMU', () => {
      expect(pxToEmu(1)).toBe(9525);
    });

    it('should convert 0 px to 0 EMU', () => {
      expect(pxToEmu(0)).toBe(0);
    });

    it('should convert 100 px to 952500 EMU', () => {
      expect(pxToEmu(100)).toBe(952500);
    });

    it('should handle fractional pixels by rounding', () => {
      expect(pxToEmu(0.5)).toBe(Math.round(0.5 * 9525));
    });

    it('should handle negative pixels', () => {
      expect(pxToEmu(-10)).toBe(Math.round(-10 * 9525));
    });
  });

  describe('ptToEmu', () => {
    it('should convert 1 pt to 12700 EMU', () => {
      expect(ptToEmu(1)).toBe(12700);
    });

    it('should convert 0 pt to 0 EMU', () => {
      expect(ptToEmu(0)).toBe(0);
    });

    it('should convert 12 pt to 152400 EMU', () => {
      expect(ptToEmu(12)).toBe(152400);
    });

    it('should handle fractional points by rounding', () => {
      expect(ptToEmu(0.5)).toBe(Math.round(0.5 * 12700));
    });
  });

  describe('ptToHalfPt', () => {
    it('should convert 12 pt to 1200 half-points', () => {
      expect(ptToHalfPt(12)).toBe(1200);
    });

    it('should convert 0 pt to 0 half-points', () => {
      expect(ptToHalfPt(0)).toBe(0);
    });

    it('should convert 1 pt to 100 half-points', () => {
      expect(ptToHalfPt(1)).toBe(100);
    });

    it('should handle fractional points by rounding', () => {
      expect(ptToHalfPt(10.5)).toBe(1050);
    });

    it('should handle very small values', () => {
      expect(ptToHalfPt(0.01)).toBe(1);
    });
  });
});
