export class AIError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function abortError(signal: AbortSignal): AIError {
  return signal.reason instanceof AIError
    ? signal.reason
    : new AIError('CANCELED', 499, 'Yêu cầu đã hủy.');
}
export function withAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) {
    // A transport may already have started; still observe its eventual rejection.
    void promise.catch(() => {});
    return Promise.reject(abortError(signal));
  }
  return new Promise((resolve, reject) => {
    const abort = () => reject(abortError(signal));
    signal.addEventListener('abort', abort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort));
  });
}
export function safeError(error: unknown): AIError {
  return error instanceof AIError
    ? error
    : new AIError(
        'UPSTREAM_ERROR',
        502,
        'Dịch vụ AI tạm thời không phản hồi. Hãy thử lại sau.',
      );
}
