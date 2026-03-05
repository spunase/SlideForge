import { CancellationToken } from './CancellationToken';

describe('CancellationToken', () => {
  describe('isCancelled', () => {
    it('should not be cancelled by default', () => {
      const token = new CancellationToken();
      expect(token.isCancelled).toBe(false);
    });

    it('should reflect cancelled state from an already-aborted signal', () => {
      const controller = new AbortController();
      controller.abort();
      const token = new CancellationToken(controller.signal);
      expect(token.isCancelled).toBe(true);
    });

    it('should become cancelled when external signal is aborted', () => {
      const controller = new AbortController();
      const token = new CancellationToken(controller.signal);
      expect(token.isCancelled).toBe(false);
      controller.abort();
      expect(token.isCancelled).toBe(true);
    });
  });

  describe('throwIfCancelled', () => {
    it('should not throw when token is not cancelled', () => {
      const token = new CancellationToken();
      expect(() => token.throwIfCancelled()).not.toThrow();
    });

    it('should throw when token is cancelled', () => {
      const controller = new AbortController();
      controller.abort();
      const token = new CancellationToken(controller.signal);
      expect(() => token.throwIfCancelled()).toThrow('Conversion cancelled');
    });

    it('should throw after external signal is aborted', () => {
      const controller = new AbortController();
      const token = new CancellationToken(controller.signal);
      controller.abort();
      expect(() => token.throwIfCancelled()).toThrow('Conversion cancelled');
    });
  });

  describe('without external signal', () => {
    it('should create a token that is not cancelled', () => {
      const token = new CancellationToken();
      expect(token.isCancelled).toBe(false);
    });

    it('should not throw when no signal is provided', () => {
      const token = new CancellationToken();
      expect(() => token.throwIfCancelled()).not.toThrow();
    });
  });
});
