import { AIError } from './errors';
export interface AIConfig {
  url: string;
  apiKey: string;
  model: string;
  maxTokens: number;
}
export function getConfig(env: Record<string, string | undefined>): AIConfig {
  try {
    const url = new URL(env.AI_BASE_URL ?? '');
    const apiKey = env.AI_API_KEY?.trim();
    const model = env.AI_MODEL?.trim();
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !apiKey ||
      !model ||
      /[\r\n]/.test(apiKey + model)
    )
      throw new Error();
    const requested = Number(env.AI_MAX_TOKENS ?? 2048);
    return {
      url: `${url.toString().replace(/\/$/, '')}/chat/completions`,
      apiKey,
      model,
      maxTokens:
        Number.isInteger(requested) && requested > 0
          ? Math.min(requested, 2048)
          : 2048,
    };
  } catch {
    throw new AIError(
      'AI_NOT_CONFIGURED',
      503,
      'AI chưa được cấu hình trên máy chủ. Bạn vẫn có thể lập và xem lá số.',
    );
  }
}
