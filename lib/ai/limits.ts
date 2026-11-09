import { AIError } from './errors';
export interface Limiter {
  acquire(): () => void;
  readonly active: number;
}
export function createLimiter(
  options: {
    concurrency?: number;
    requests?: number;
    windowMs?: number;
    now?: () => number;
  } = {},
): Limiter {
  const {
    concurrency = 2,
    requests = 20,
    windowMs = 60_000,
    now = Date.now,
  } = options;
  let active = 0;
  let count = 0;
  let windowStart = now();
  return {
    get active() {
      return active;
    },
    acquire() {
      const current = now();
      if (current - windowStart >= windowMs) {
        windowStart = current;
        count = 0;
      }
      if (count >= requests || active >= concurrency)
        throw new AIError(
          'RATE_LIMITED',
          429,
          'Đã đạt giới hạn AI. Vui lòng chờ rồi thử lại.',
        );
      count += 1;
      active += 1;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          active -= 1;
        }
      };
    },
  };
}
// Shared across both routes in this server process. Multiple instances need a shared external budget.
const state = globalThis as typeof globalThis & { __tuViAILimiter?: Limiter };
export const processLimiter = (state.__tuViAILimiter ??= createLimiter());
