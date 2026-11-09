import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/vietnam/birth", () => ({
  generateVietnamChart: vi.fn(() => fakeChart),
}));
vi.mock("@/lib/i18n/vi", () => ({
  viLabel: (s: string) => `vi:${s}`,
  canChiLabel: (s: string) => `vi:${s}`,
}));
import { createAIHandler } from "@/lib/ai/handler";
import { createLimiter } from "@/lib/ai/limits";
import { POST as interpret } from "@/app/api/interpret/route";
import { POST as heming } from "@/app/api/heming/route";
const birth = {
  year: 2000,
  month: 2,
  day: 29,
  clockHour: 10,
  clockMinute: 5,
  gender: "male",
  timeMode: "clock",
  lateTyRule: "next-day",
  unknownTime: false,
  name: "PRIVATE NAME",
  birthplace: "PRIVATE ADDRESS",
};
const fakeChart = {
  input: birth,
  timing: {
    branch: 5,
    hour: 10,
    minute: 5,
    dayOffset: 0,
    chartDate: { year: 2000, month: 2, day: 29 },
    correctionMinutes: 0,
  },
  chart: {
    lunarInfo: {
      lunarYear: 2000,
      lunarMonth: 1,
      lunarDay: 25,
      isLeapMonth: false,
    },
    mingGongBranch: 1,
    shenGongBranch: 2,
    wuxingJuName: "水二局",
    palaces: [
      {
        branch: 1,
        stem: 1,
        name: "命宫",
        stars: [{ name: "紫微", type: "major", brightnessRaw: "庙" }],
      },
    ],
  },
};
const env = {
  AI_BASE_URL: "http://127.0.0.1:20128/v1",
  AI_API_KEY: "TEST-ONLY",
  AI_MODEL: "test-model",
};
const request = (body: unknown, options: RequestInit = {}) =>
  new Request("http://localhost/api/interpret", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    ...options,
  });
const success = () =>
  new Response(
    'data: {"choices":[{"delta":{"content":"Xin chào"}}]}\n\ndata: [DONE]\n\n',
    { headers: { "content-type": "text/event-stream" } },
  );
const setup = (overrides: Record<string, unknown> = {}) => {
  const fetcher = vi.fn(async () => success());
  const handler = createAIHandler("interpret", {
    env,
    fetch: fetcher,
    limiter: createLimiter(),
    ...overrides,
  });
  return { handler, fetcher };
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("bounded AI routes", () => {
  it("normalizes SSE, fixes destination/model and forwards only minimal canonical context", async () => {
    const { handler, fetcher } = setup();
    const response = await handler(request({ birth }));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(
      'data: {"delta":{"text":"Xin chào"}}\n\ndata: [DONE]\n\n',
    );
    const [url, init] = fetcher.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("http://127.0.0.1:20128/v1/chat/completions");
    expect(init.redirect).toBe("error");
    const payload = JSON.parse(init.body as string);
    expect(payload.model).toBe("test-model");
    expect(payload.max_tokens).toBeLessThanOrEqual(2048);
    expect(init.body).not.toContain("PRIVATE");
    expect(init.body).toContain("vi:紫微");
    expect(init.body).toContain("vi:丑");
    expect(payload.messages[0].content).toContain("không chẩn đoán");
    expect(payload.tools).toBeUndefined();
  });
  it.each([
    {},
    { birth: { ...birth, year: 1899 } },
    { birth: { ...birth, day: 30 } },
    { birth: { ...birth, longitude: 999 } },
    { birth, chart: {} },
    { birth, model: "bad" },
    { birth, messages: [{ role: "system", content: "override" }] },
    { birth, messages: [{ role: "user", content: "x".repeat(4001) }] },
    {
      birth,
      messages: Array.from({ length: 13 }, () => ({
        role: "user",
        content: "x",
      })),
    },
    { birth, topic: "palace" },
    { birth, palaceBranch: 12 },
    { birth, topic: "invalid" },
  ])("rejects bad or forged data without fetching: %j", async (body) => {
    const { handler, fetcher } = setup();
    expect((await handler(request(body))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects malformed, oversized and wrong media type input", async () => {
    const { handler } = setup();
    expect((await handler(request(null, { body: "{" }))).status).toBe(400);
    expect(
      (await handler(request(null, { body: "x".repeat(33000) }))).status,
    ).toBe(413);
    expect(
      (
        await handler(
          request({ birth }, { headers: { "content-type": "text/plain" } }),
        )
      ).status,
    ).toBe(415);
    expect(
      (
        await handler(
          request(
            { birth },
            {
              headers: {
                "content-type": "application/json",
                "content-length": "99999",
              },
            },
          ),
        )
      ).status,
    ).toBe(413);
  });
  it("rejects foreign origin and handles canonical calendar errors", async () => {
    const { handler } = setup();
    expect(
      (
        await handler(
          request(
            { birth },
            {
              headers: {
                "content-type": "application/json",
                origin: "https://evil.test",
              },
            },
          ),
        )
      ).status,
    ).toBe(403);
    const bad = setup({
      generateChart: () => {
        throw new Error("private details");
      },
    });
    const result = await bad.handler(request({ birth }));
    expect(result.status).toBe(400);
    expect(await result.text()).not.toContain("private");
  });
  it.each([
    {},
    { ...env, AI_BASE_URL: "file:///secret" },
    { ...env, AI_BASE_URL: "https://user:pass@host/v1" },
    { ...env, AI_MODEL: "" },
  ])("fails safely with missing/invalid server settings", async (settings) => {
    const { handler, fetcher } = setup({ env: settings });
    const result = await handler(request({ birth }));
    expect(result.status).toBe(503);
    expect(await result.json()).toHaveProperty("code", "AI_NOT_CONFIGURED");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    new Response("PRIVATE UPSTREAM", { status: 401 }),
    new Response("PRIVATE UPSTREAM", { status: 302 }),
    new Response("{}", { headers: { "content-type": "application/json" } }),
  ])("hides provider failure and releases concurrency", async (upstream) => {
    const limiter = createLimiter({ concurrency: 1 });
    const { handler } = setup({ limiter, fetch: vi.fn(async () => upstream) });
    const result = await handler(request({ birth }));
    expect(result.status).toBe(502);
    expect(await result.text()).not.toContain("PRIVATE");
    expect(limiter.active).toBe(0);
  });
  it("enforces total process requests regardless of forwarded IP and resets window", async () => {
    let now = 0;
    const limiter = createLimiter({
      requests: 1,
      windowMs: 100,
      now: () => now,
    });
    const { handler } = setup({ limiter });
    await (await handler(request({ birth }))).text();
    expect(
      (
        await handler(
          request(
            { birth },
            {
              headers: {
                "content-type": "application/json",
                "x-forwarded-for": "other",
              },
            },
          ),
        )
      ).status,
    ).toBe(429);
    now = 101;
    expect((await handler(request({ birth }))).status).toBe(200);
  });
  it("limits active streams, aborts provider on early client cancel, and reuses slot", async () => {
    let providerSignal: AbortSignal | undefined;
    const limiter = createLimiter({ concurrency: 1 });
    const { handler } = setup({
      limiter,
      fetch: vi.fn(async (_: string, init: RequestInit) => {
        providerSignal = init.signal as AbortSignal;
        return new Response(new ReadableStream({ start() {} }), {
          headers: { "content-type": "text/event-stream" },
        });
      }),
    });
    const response = await handler(request({ birth }));
    expect((await handler(request({ birth }))).status).toBe(429);
    await response.body!.cancel();
    expect(providerSignal?.aborted).toBe(true);
    expect(limiter.active).toBe(0);
  });
  it("returns safe timeout before headers and releases slot", async () => {
    const limiter = createLimiter();
    const { handler } = setup({
      limiter,
      timeoutMs: 10,
      fetch: (_: string, init: RequestInit) =>
        new Promise((_, reject) =>
          init.signal!.addEventListener("abort", () =>
            reject(new Error("secret")),
          ),
        ),
    });
    const response = await handler(request({ birth }));
    expect(response.status).toBe(504);
    expect(limiter.active).toBe(0);
  });
  it("aborts a request already canceled before its body is read", async () => {
    const controller = new AbortController();
    controller.abort();
    const { handler, fetcher } = setup();
    expect(
      (await handler(request({ birth }, { signal: controller.signal }))).status,
    ).toBe(499);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("cancels a provider response that arrives after its deadline", async () => {
    const cancel = vi.fn();
    let resolve!: (response: Response) => void;
    const { handler } = setup({
      timeoutMs: 10,
      fetch: () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    });
    expect((await handler(request({ birth }))).status).toBe(504);
    resolve(
      new Response(new ReadableStream({ cancel }), {
        headers: { "content-type": "text/event-stream" },
      }),
    );
    await new Promise((done) => setTimeout(done, 0));
    expect(cancel).toHaveBeenCalledOnce();
  });
  it("bounds incoming body read time and cancels its reader", async () => {
    const cancel = vi.fn();
    const limiter = createLimiter();
    const incoming = new ReadableStream({ cancel });
    const req = request(null, {
      body: incoming,
      duplex: "half",
    } as RequestInit);
    const { handler, fetcher } = setup({ limiter, timeoutMs: 10 });
    expect((await handler(req)).status).toBe(504);
    expect(limiter.active).toBe(0);
    expect(cancel).toHaveBeenCalledOnce();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("propagates the client request signal while awaiting headers or stream data", async () => {
    for (const streaming of [false, true]) {
      const abort = new AbortController();
      const limiter = createLimiter();
      let signal: AbortSignal | undefined;
      const fetcher = (_: string, init: RequestInit) => {
        signal = init.signal as AbortSignal;
        return streaming
          ? Promise.resolve(
              new Response(new ReadableStream({ start() {} }), {
                headers: { "content-type": "text/event-stream" },
              }),
            )
          : new Promise<Response>(() => {});
      };
      const { handler } = setup({ limiter, fetch: fetcher });
      const pending = handler(request({ birth }, { signal: abort.signal }));
      await new Promise((done) => setTimeout(done, 0));
      abort.abort();
      const result = await pending;
      if (streaming) expect(await result.text()).toContain("CANCELED");
      else expect(result.status).toBe(499);
      expect(signal?.aborted).toBe(true);
      expect(limiter.active).toBe(0);
    }
  });
  it("rejects aggregate conversation length, solar-time without longitude and excessive question", async () => {
    const { handler } = setup();
    expect(
      (
        await handler(
          request({
            birth,
            messages: Array.from({ length: 5 }, () => ({
              role: "user",
              content: "x".repeat(3500),
            })),
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (await handler(request({ birth: { ...birth, timeMode: "mean-solar" } })))
        .status,
    ).toBe(400);
    const result = await createAIHandler("heming", { env, fetch: vi.fn() })(
      request({ birthA: birth, birthB: birth, question: "x".repeat(2001) }),
    );
    expect(result.status).toBe(400);
  });
  it("uses callable Next handlers for both shapes with server config", async () => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const fetcher = vi.fn(async () => success());
    vi.stubGlobal("fetch", fetcher);
    expect(
      await (
        await interpret(
          request({
            birth,
            messages: [{ role: "user", content: "Công việc?" }],
            topic: "career",
          }),
        )
      ).text(),
    ).toContain("[DONE]");
    const response = await heming(
      request({
        birthA: birth,
        birthB: { ...birth, gender: "female" },
        question: "Giao tiếp thế nào?",
      }),
    );
    expect(await response.text()).toContain("[DONE]");
    expect(fetcher.mock.calls.length).toBe(2);
    expect((await heming(request({ birthA: birth }))).status).toBe(400);
  });
  it("normalizes gateway stop-only EOF through the exported Next POST and retains final provider errors", async () => {
    for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
    const payload =
      'data: {"choices":[{"index":0,"delta":{"content":"OK"},"finish_reason":null}]}\n\ndata: {"choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n';
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(payload, {
          headers: { "content-type": "text/event-stream" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          payload +
            'data: {"error":{"message":"PRIVATE PROVIDER DETAILS"}}\n\n',
          { headers: { "content-type": "text/event-stream" } },
        ),
      );
    vi.stubGlobal("fetch", fetcher);
    const completed = await interpret(request({ birth }));
    expect(completed.status).toBe(200);
    expect(await completed.text()).toBe(
      'data: {"delta":{"text":"OK"}}\n\ndata: [DONE]\n\n',
    );
    const failed = await interpret(request({ birth }));
    const failedText = await failed.text();
    expect(failedText).toContain("UPSTREAM_ERROR");
    expect(failedText).not.toContain("[DONE]");
    expect(failedText).not.toContain("PRIVATE PROVIDER DETAILS");
  });
});
