import { describe, expect, it, vi } from "vitest";
import { createAIHandler } from "@/lib/ai/handler";
import { createLimiter } from "@/lib/ai/limits";

function setup(siteURL?: string) {
  const fetcher = vi.fn();
  const limiter = createLimiter();
  const handler = createAIHandler("interpret", {
    env: siteURL === undefined ? {} : { NEXT_PUBLIC_SITE_URL: siteURL },
    fetch: fetcher,
    limiter,
  });
  const request = (
    origin: string | null,
    url = "http://localhost:3018/api/interpret",
    headers: Record<string, string> = {},
  ) =>
    handler(
      new Request(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(origin === null ? {} : { Origin: origin }),
          ...headers,
        },
        body: "{}",
      }),
    );
  return { request, fetcher, limiter };
}

describe("browser origin behind Next internal hostname", () => {
  it.each([
    ["http://127.0.0.1:3018", "http://127.0.0.1:3018"],
    ["https://public.example/", "https://public.example"],
  ])(
    "accepts configured browser origin %s despite internal localhost request URL",
    async (siteURL, origin) => {
      const { request, fetcher, limiter } = setup(siteURL);
      const response = await request(origin);
      expect(response.status).toBe(400);
      expect(await response.json()).toHaveProperty("code", "INVALID_INPUT");
      expect(fetcher).not.toHaveBeenCalled();
      expect(limiter.active).toBe(0);
    },
  );
  it.each([
    "http://localhost:3018",
    "https://foreign.example",
    "null",
    "",
    "https://public.example/path",
    "https://public.example, https://foreign.example",
  ])(
    "rejects foreign or malformed origin %s when public origin configured",
    async (origin) => {
      const { request, fetcher } = setup("https://public.example");
      const response = await request(origin);
      expect(response.status).toBe(403);
      expect(await response.json()).toHaveProperty("code", "ORIGIN_REJECTED");
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("does not trust arbitrary Host or forwarded Host to override configured origin", async () => {
    const { request } = setup("https://public.example");
    expect(
      (
        await request("https://foreign.example", undefined, {
          host: "foreign.example",
          "x-forwarded-host": "foreign.example",
          "x-forwarded-proto": "https",
        })
      ).status,
    ).toBe(403);
  });
  it("uses request URL origin when site URL absent, and permits native calls without Origin", async () => {
    const { request } = setup();
    expect((await request("http://localhost:3018")).status).toBe(400);
    expect((await request("http://127.0.0.1:3018")).status).toBe(403);
    expect((await request(null)).status).toBe(400);
  });
  it.each([
    "invalid",
    "file:///local",
    "https://user:password@public.example",
    "",
  ])(
    "fails closed with safe 503 for malformed configured site URL %s",
    async (siteURL) => {
      const { request, fetcher } = setup(siteURL);
      const response = await request("http://localhost:3018");
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain("password");
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
});
