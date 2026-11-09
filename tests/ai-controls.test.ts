import { describe, expect, it } from 'vitest';
import { getConfig } from '@/lib/ai/config';
import { AIError, withAbort } from '@/lib/ai/errors';
import { createLimiter } from '@/lib/ai/limits';
import { readInput } from '@/lib/ai/schemas';
describe('AI control boundary details', () => {
  it('clamps token settings and normalizes base URL', () => {
    const config = {
      AI_BASE_URL: 'https://gateway.test/v1/',
      AI_API_KEY: 'test',
      AI_MODEL: 'model',
    };
    expect(getConfig({ ...config, AI_MAX_TOKENS: '999999' }).maxTokens).toBe(
      2048,
    );
    expect(getConfig({ ...config, AI_MAX_TOKENS: '500' }).maxTokens).toBe(500);
    expect(getConfig({ ...config, AI_MAX_TOKENS: 'NaN' }).maxTokens).toBe(2048);
    expect(getConfig(config).url).toBe(
      'https://gateway.test/v1/chat/completions',
    );
    expect(() =>
      getConfig({ ...config, AI_BASE_URL: 'https://gateway.test/v1?secret=x' }),
    ).toThrow(AIError);
    expect(() => getConfig({ ...config, AI_API_KEY: 'test\r\nvalue' })).toThrow(
      AIError,
    );
  });
  it('keeps release idempotent so double cleanup never grants excess concurrency', () => {
    const limiter = createLimiter({ concurrency: 1 });
    const release = limiter.acquire();
    release();
    release();
    expect(limiter.active).toBe(0);
    const next = limiter.acquire();
    expect(() => limiter.acquire()).toThrow(AIError);
    next();
  });
  it('rejects a missing body and malformed UTF8 without exposing decoder errors', async () => {
    const signal = new AbortController().signal;
    const empty = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    await expect(readInput(empty, 'interpret', signal)).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    });
    const invalid = new Request('http://localhost', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: new Uint8Array([255]),
    });
    await expect(readInput(invalid, 'interpret', signal)).rejects.toMatchObject(
      { code: 'INVALID_INPUT' },
    );
  });
  it('observes rejection of an operation passed an already aborted signal', async () => {
    const controller = new AbortController();
    controller.abort(new AIError('AI_TIMEOUT', 504, 'timeout'));
    await expect(
      withAbort(
        Promise.reject(new Error('late operation rejection')),
        controller.signal,
      ),
    ).rejects.toMatchObject({ code: 'AI_TIMEOUT' });
    await new Promise((done) => setTimeout(done, 0));
  });
});
