/**
 * CancellationToken — wraps an AbortSignal to provide a convenient
 * cancellation check between pipeline stages.
 */

export class CancellationToken {
  private abortController: AbortController;

  constructor(signal?: AbortSignal) {
    this.abortController = new AbortController();

    // If an external signal is provided, listen to it and propagate abort
    if (signal) {
      if (signal.aborted) {
        this.abortController.abort();
      } else {
        signal.addEventListener('abort', () => {
          this.abortController.abort();
        });
      }
    }
  }

  /**
   * Whether the token has been cancelled.
   */
  get isCancelled(): boolean {
    return this.abortController.signal.aborted;
  }

  /**
   * Throws an error if the token has been cancelled.
   * Call this between pipeline stages to allow early exit.
   */
  throwIfCancelled(): void {
    if (this.isCancelled) {
      throw new Error('Conversion cancelled');
    }
  }
}
