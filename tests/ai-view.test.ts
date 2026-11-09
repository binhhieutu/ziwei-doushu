import { describe, expect, it, vi } from "vitest";
import { resolveVietnamView } from "@/lib/vietnam/view";
import { generateVietnamChart } from "@/lib/vietnam/birth";
import { createAIHandler } from "@/lib/ai/handler";
import { createLimiter } from "@/lib/ai/limits";
import { getSiHuaByStem, getYearStemIndex } from "@/lib/ziwei/sihua";
const birth = {
  year: 2000,
  month: 2,
  day: 29,
  clockHour: 10,
  clockMinute: 5,
  gender: "male" as const,
  timeMode: "clock" as const,
  lateTyRule: "next-day" as const,
  unknownTime: false,
};
const env = {
  AI_BASE_URL: "http://127.0.0.1:20128/v1",
  AI_API_KEY: "test-only",
  AI_MODEL: "test-model",
};
const request = (body: unknown) =>
  new Request("http://localhost/api/interpret", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
function setup(mode: "interpret" | "heming" = "interpret") {
  const fetcher = vi.fn(
    async () =>
      new Response("data: [DONE]\n\n", {
        headers: { "content-type": "text/event-stream" },
      }),
  );
  return {
    fetcher,
    handler: createAIHandler(mode, {
      env,
      fetch: fetcher,
      limiter: createLimiter(),
    }),
  };
}
describe("canonical selected chart period", () => {
  const { chart } = generateVietnamChart(birth);
  it("derives natal and yearly transformations from canonical stems", () => {
    expect(resolveVietnamView(chart)).toMatchObject({
      mode: "natal",
      stemIndex: chart.lunarInfo.yearStem,
      transforms: getSiHuaByStem(chart.lunarInfo.yearStem),
    });
    const first = resolveVietnamView(chart, { mode: "year", year: 2026 });
    const second = resolveVietnamView(chart, { mode: "year", year: 2027 });
    expect(first).toMatchObject({
      mode: "year",
      year: 2026,
      stemIndex: getYearStemIndex(2026),
      transforms: getSiHuaByStem(getYearStemIndex(2026)),
    });
    expect(first.transforms).not.toEqual(second.transforms);
  });
  it("derives actual decade age bounds and palace stem, and rejects nonexistent decades", () => {
    const decadeIndex = 1;
    const decade = chart.daXians[decadeIndex];
    const stem = chart.palaces.find(
      (palace) => palace.branch === decade.palaceBranch,
    )!.stem;
    expect(
      resolveVietnamView(chart, { mode: "decade", decadeIndex }),
    ).toMatchObject({
      mode: "decade",
      decadeIndex,
      startAge: decade.startAge,
      endAge: decade.endAge,
      palaceBranch: decade.palaceBranch,
      stemIndex: stem,
      transforms: getSiHuaByStem(stem),
    });
    expect(() =>
      resolveVietnamView(
        { ...chart, daXians: [] },
        { mode: "decade", decadeIndex: 0 },
      ),
    ).toThrow();
    expect(() =>
      resolveVietnamView(
        { ...chart, palaces: [] },
        { mode: "decade", decadeIndex: 0 },
      ),
    ).toThrow();
  });
  it("sends different canonical Vietnamese provider context for two years and a decade", async () => {
    const { handler, fetcher } = setup();
    for (const view of [
      { mode: "year", year: 2026 },
      { mode: "year", year: 2027 },
      { mode: "decade", decadeIndex: 1 },
    ]) {
      expect(await (await handler(request({ birth, view }))).text()).toContain(
        "[DONE]",
      );
    }
    const payloads = fetcher.mock.calls.map((call) =>
      JSON.parse((call as unknown as [string, RequestInit])[1].body as string),
    );
    const contexts = payloads.map((payload) =>
      JSON.parse(payload.messages[1].content.split("\n")[1]),
    );
    expect(contexts[0].giaiDoan).toMatchObject({
      mode: "year",
      nam: 2026,
      nhan: "Lưu niên",
    });
    expect(contexts[1].giaiDoan).toMatchObject({ mode: "year", nam: 2027 });
    expect(contexts[0].giaiDoan.tuHoa).not.toEqual(contexts[1].giaiDoan.tuHoa);
    expect(contexts[2].giaiDoan).toMatchObject({
      mode: "decade",
      daiHanIndex: 1,
      tuoiBatDau: chart.daXians[1].startAge,
      tuoiKetThuc: chart.daXians[1].endAge,
      nhan: "Đại hạn",
    });
    expect(contexts[2].giaiDoan.tuHoa).toHaveLength(4);
  });
  it.each([
    { mode: "year", year: 2201 },
    { mode: "year", year: 1899 },
    { mode: "year", year: 2026.5 },
    { mode: "decade", decadeIndex: -1 },
    { mode: "decade", decadeIndex: 12 },
    { mode: "natal", year: 2026 },
    { mode: "year", year: 2026, transforms: {} },
    { mode: "invalid" },
  ])(
    "rejects malicious or malformed selected period before provider: %j",
    async (view) => {
      const { handler, fetcher } = setup();
      expect((await handler(request({ birth, view }))).status).toBe(400);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("rejects a schema-valid decade absent from the computed canonical chart", async () => {
    const fetcher = vi.fn();
    const handler = createAIHandler("interpret", {
      env,
      fetch: fetcher,
      limiter: createLimiter(),
      generateChart: (input) => {
        const result = generateVietnamChart(input);
        return { ...result, chart: { ...result.chart, daXians: [] } };
      },
    });
    expect(
      (
        await handler(
          request({ birth, view: { mode: "decade", decadeIndex: 0 } }),
        )
      ).status,
    ).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
describe("compatibility follow-up ordering", () => {
  it("places the current second-turn question after the first user/assistant exchange", async () => {
    const { handler, fetcher } = setup("heming");
    const messages = [
      { role: "user", content: "Câu hỏi lượt một" },
      { role: "assistant", content: "Trả lời lượt một" },
    ];
    await (
      await handler(
        request({
          birthA: birth,
          birthB: { ...birth, gender: "female" },
          messages,
          question: "Câu hỏi lượt hai",
        }),
      )
    ).text();
    const payload = JSON.parse(
      (fetcher.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string,
    );
    expect(payload.messages.slice(-3)).toEqual([
      ...messages,
      { role: "user", content: "Câu hỏi lượt hai" },
    ]);
    expect(payload.messages[1].content).not.toContain("Câu hỏi lượt hai");
  });
});
