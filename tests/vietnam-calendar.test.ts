import { describe, expect, it, vi } from "vitest";
import { Solar } from "lunar-javascript";
import {
  solarToVietnamLunar,
  vietnamLunarToSolar,
} from "../lib/vietnam/calendar";
import { generateVietnamChart } from "../lib/vietnam/birth";
import type { VietnamBirthInput } from "../lib/vietnam/types";
import { generateChart, getLunarInfo } from "../lib/ziwei/algorithm";
import { calculateTrueSolarTime } from "../lib/ziwei/true-solar-time";

const base: VietnamBirthInput = {
  year: 2007,
  month: 2,
  day: 17,
  clockHour: 12,
  clockMinute: 0,
  gender: "male",
  timeMode: "clock",
  lateTyRule: "next-day",
  unknownTime: false,
};

describe("Vietnamese lunar calendar boundary", () => {
  // Independent fixture: Nhân Dân's VOV Tết programme explicitly dates mùng1
  // to Saturday17/02/2007: https://nhandan.vn/chuong-trinh-tet-cua-dai-tieng-noi-viet-nam-post404808.html
  it.each([
    [
      { year: 2007, month: 2, day: 17 },
      { year: 2007, month: 1, day: 1, isLeapMonth: false },
    ],
    [
      { year: 2024, month: 2, day: 10 },
      { year: 2024, month: 1, day: 1, isLeapMonth: false },
    ],
    [
      { year: 2023, month: 3, day: 22 },
      { year: 2023, month: 2, day: 1, isLeapMonth: true },
    ],
    [
      { year: 2020, month: 5, day: 23 },
      { year: 2020, month: 4, day: 1, isLeapMonth: true },
    ],
  ])("converts real Vietnamese month boundaries %j", (solar, lunar) => {
    expect(solarToVietnamLunar(solar)).toEqual(lunar);
    expect(vietnamLunarToSolar(lunar)).toEqual(solar);
  });

  it.each([
    { year: 1900, month: 1, day: 1 },
    { year: 2050, month: 12, day: 31 },
    { year: 2024, month: 2, day: 29 },
  ])("roundtrips supported civil boundary %j", (solar) => {
    expect(vietnamLunarToSolar(solarToVietnamLunar(solar))).toEqual(solar);
  });

  it.each([
    { year: 2023, month: 2, day: 29 },
    { year: 2024, month: 4, day: 31 },
    { year: 2024, month: 0, day: 1 },
    { year: 2024, month: 13, day: 1 },
    { year: 1899, month: 12, day: 31 },
    { year: 2051, month: 1, day: 1 },
    { year: NaN, month: 1, day: 1 },
    { year: 2024, month: 1, day: 1.5 },
  ])("rejects nonexistent/out-of-range solar dates %j", (date) => {
    expect(() => solarToVietnamLunar(date)).toThrow(RangeError);
  });

  it.each([
    { year: 2024, month: 2, day: 1, isLeapMonth: true },
    { year: 2023, month: 2, day: 30, isLeapMonth: true },
    { year: 2024, month: 1, day: 31, isLeapMonth: false },
    { year: 2024, month: -2, day: 1, isLeapMonth: false },
    { year: 2024, month: 1, day: 0, isLeapMonth: false },
    { year: 1899, month: 1, day: 1, isLeapMonth: false },
  ])("rejects lunar normalization and invalid leap claims %j", (date) => {
    expect(() => vietnamLunarToSolar(date)).toThrow(RangeError);
  });
});

describe("canonical Vietnam chart", () => {
  it("uses Vietnam lunar data for placement/year and real civil date for day pillars", () => {
    const { chart, input, timing } = generateVietnamChart(base);
    expect(chart.lunarInfo).toMatchObject({
      lunarYear: 2007,
      lunarMonth: 1,
      lunarDay: 1,
      yearStem: 3,
      yearBranch: 11,
      isLeapMonth: false,
    });
    expect(chart.birthInfo).toMatchObject({
      year: 2007,
      month: 2,
      day: 17,
      hour: 6,
    });
    expect(chart.mingGongBranch).toBe(8); // 正月寅宮起子時，逆數至午時=申
    expect(chart.shenGongBranch).toBe(8);
    expect(chart.lunarInfo.fourPillars?.[2]).toBe(
      getLunarInfo(2007, 2, 17, 6).fourPillars?.[2],
    );
    expect(chart.lunarInfo.fourPillarsLunar?.[0]).toBe("丁亥");
    expect(chart.lunarInfo.fourPillarsLunar?.[1]).toBe("壬寅");
    expect(input).toEqual(base);
    expect(timing.correctionMinutes).toBe(0);
    expect(
      chart.palaces.flatMap((p) => p.stars).some((s) => s.name === "紫微"),
    ).toBe(true);
    expect(Number(Solar.fromYmd(2007, 2, 17).getLunar().getYear())).toBe(2006); // Upstream China differs.
  });

  it("retains original input and unknown-time assumption without mutating caller data", () => {
    const original = Object.freeze({
      ...base,
      unknownTime: true,
      name: "Giờ giả định",
      birthplace: "Huế",
    });
    const result = generateVietnamChart(original);
    expect(result.input).toEqual(original);
    expect(result.input).not.toBe(original);
    expect(result.chart.birthInfo.origInput).toEqual({
      year: 2007,
      month: 2,
      day: 17,
      clockHour: 12,
      clockMinute: 0,
    });
  });

  it.each([
    [22, 59, "next-day", 11, { year: 2024, month: 2, day: 9 }, 0],
    [23, 0, "next-day", 0, { year: 2024, month: 2, day: 10 }, 1],
    [23, 0, "current-day", 0, { year: 2024, month: 2, day: 9 }, 0],
    [0, 0, "next-day", 0, { year: 2024, month: 2, day: 9 }, 0],
  ] as const)(
    "resolves %i:%i with %s",
    (clockHour, clockMinute, lateTyRule, branch, chartDate, dayOffset) => {
      const result = generateVietnamChart({
        ...base,
        year: 2024,
        month: 2,
        day: 9,
        clockHour,
        clockMinute,
        lateTyRule,
      });
      expect(result.timing).toMatchObject({
        branch,
        chartDate,
        dayOffset,
        hour: clockHour,
        minute: clockMinute,
      });
      expect(result.chart.birthInfo).toMatchObject({
        ...chartDate,
        hour: branch,
      });
      expect(result.chart.lunarInfo.lunarDay).toBe(dayOffset === 1 ? 1 : 30);
    },
  );

  it("handles Tý rollover at year-end and solar correction across midnight", () => {
    const next = generateVietnamChart({
      ...base,
      year: 2024,
      month: 12,
      day: 31,
      clockHour: 23,
    });
    expect(next.timing.chartDate).toEqual({ year: 2025, month: 1, day: 1 });
    const before = generateVietnamChart({
      ...base,
      clockHour: 0,
      clockMinute: 10,
      timeMode: "mean-solar",
      longitude: 100,
      lateTyRule: "current-day",
    });
    expect(before.timing).toMatchObject({
      hour: 23,
      minute: 50,
      dayOffset: -1,
      correctionMinutes: -20,
      chartDate: { year: 2007, month: 2, day: 16 },
    });
    const after = generateVietnamChart({
      ...base,
      clockHour: 23,
      clockMinute: 50,
      timeMode: "mean-solar",
      longitude: 110,
    });
    expect(after.timing).toMatchObject({
      hour: 0,
      minute: 10,
      dayOffset: 1,
      chartDate: { year: 2007, month: 2, day: 18 },
    });
  });

  it("uses105° for mean solar time and keeps clock mode unchanged by longitude", () => {
    expect(
      generateVietnamChart({ ...base, longitude: 105, timeMode: "mean-solar" })
        .timing.correctionMinutes,
    ).toBe(0);
    expect(
      generateVietnamChart({ ...base, longitude: 110, timeMode: "mean-solar" })
        .timing,
    ).toMatchObject({ hour: 12, minute: 20, correctionMinutes: 20 });
    expect(
      generateVietnamChart({ ...base, longitude: 110 }).timing
        .correctionMinutes,
    ).toBe(0);
    expect(
      calculateTrueSolarTime({ ...base, longitude: 120 })
        .longitudeCorrectionMinutes,
    ).toBe(0);
  });

  it("adds equation of time only in apparent-solar mode with explicit longitude", () => {
    const apparent = generateVietnamChart({
      ...base,
      year: 2024,
      month: 11,
      day: 3,
      longitude: 105,
      timeMode: "apparent-solar",
    });
    expect(apparent.timing.correctionMinutes).toBeGreaterThan(16);
    expect(apparent.timing.correctionMinutes).toBeLessThan(17);
    expect(apparent.timing).toMatchObject({ hour: 12, minute: 16 });
  });

  it.each([
    { clockHour: 24 },
    { clockMinute: 60 },
    { clockHour: -1 },
    { clockMinute: 1.5 },
    { gender: "other" },
    { timeMode: "guess" },
    { lateTyRule: "all-current" },
    { unknownTime: undefined },
    { longitude: NaN },
    { longitude: 181 },
    { name: 7 },
    { birthplace: "x".repeat(201) },
    { timeMode: "mean-solar", longitude: undefined },
    { timeMode: "apparent-solar", longitude: undefined },
    { year: 2024, month: 2, day: 30 },
    { year: 2050, month: 12, day: 31, clockHour: 23 },
  ])("rejects bad birth data safely %j", (patch) => {
    expect(() =>
      generateVietnamChart({ ...base, ...patch } as VietnamBirthInput),
    ).toThrow(RangeError);
    expect(() =>
      generateVietnamChart({ ...base, ...patch } as VietnamBirthInput),
    ).toThrow(/[À-ỹ]/);
  });

  it("retains raw Vietnam leap-month data in chart metadata", () => {
    const { chart } = generateVietnamChart({
      ...base,
      year: 2023,
      month: 4,
      day: 6,
    });
    expect(chart.lunarInfo).toMatchObject({
      lunarYear: 2023,
      lunarMonth: 2,
      lunarDay: 16,
      isLeapMonth: true,
    });
    expect(chart.mingGongBranch).toBe(10); // split: second half of leap2 uses month3, 午時.
  });

  it("places a Vietnamese day30 even when the corresponding Chinese month has29days", () => {
    const { chart } = generateVietnamChart({
      ...base,
      year: 2006,
      month: 7,
      day: 24,
    });
    expect(chart.lunarInfo).toMatchObject({
      lunarYear: 2006,
      lunarMonth: 6,
      lunarDay: 30,
      isLeapMonth: false,
    });
    expect(chart.mingGongBranch).toBe(1); // month6, 午時: 未−午=丑.
    expect(chart.wuxingJu).toBe(5); // 丙年辛丑納音土五局.
    expect(chart.ziweiPos).toBe(7); // 30/5=6; 寅起第6宮=未.
    expect(
      chart.palaces.find((p) => p.stars.some((s) => s.name === "天府"))?.branch,
    ).toBe(9);
    expect(
      chart.palaces.find((p) => p.stars.some((s) => s.name === "三台"))?.branch,
    ).toBe(2);
    expect(
      chart.palaces.find((p) => p.stars.some((s) => s.name === "八座"))?.branch,
    ).toBe(0);
    expect(chart.birthInfo.day).toBe(24);
  });

  it("handles a Vietnam leap month that is normal in China without inventing a civil birthday", () => {
    const { chart } = generateVietnamChart({
      ...base,
      year: 1985,
      month: 3,
      day: 21,
    });
    expect(chart.lunarInfo).toMatchObject({
      lunarYear: 1985,
      lunarMonth: 2,
      lunarDay: 1,
      isLeapMonth: true,
    });
    expect(chart.birthInfo).toMatchObject({ year: 1985, month: 3, day: 21 });
    expect(chart.mingGongBranch).toBe(9);
    expect(chart.shenGongBranch).toBe(9);
    expect(chart.lunarInfo.fourPillars?.[2]).toBe(
      getLunarInfo(1985, 3, 21, 6).fourPillars?.[2],
    );
  });

  it("uses actual UTC+7 minutes for solar-term year/month pillars", () => {
    const before = generateVietnamChart({
      ...base,
      year: 2024,
      month: 2,
      day: 4,
      clockHour: 15,
    });
    const after = generateVietnamChart({
      ...base,
      year: 2024,
      month: 2,
      day: 4,
      clockHour: 16,
    });
    expect(before.chart.lunarInfo.fourPillars?.[0]).toBe("癸卯");
    expect(after.chart.lunarInfo.fourPillars?.[0]).toBe("甲辰");
    expect(before.chart.lunarInfo.fourPillarsLunar?.[0]).toBe("癸卯");
    expect(after.chart.lunarInfo.fourPillarsLunar?.[0]).toBe("癸卯");
  });

  it.each([
    ["mean-solar", 15, 110, ["癸卯", "乙丑"]],
    ["apparent-solar", 25, 110, ["癸卯", "乙丑"]],
    ["mean-solar", 30, 100, ["甲辰", "丙寅"]],
    ["apparent-solar", 30, 100, ["甲辰", "丙寅"]],
  ] as const)(
    "keeps solar-term pillars tied to the original UTC+7 instant in %s mode at15:%i",
    (timeMode, clockMinute, longitude, expected) => {
      const input: VietnamBirthInput = {
        ...base,
        year: 2024,
        month: 2,
        day: 4,
        clockHour: 15,
        clockMinute,
        longitude,
      };
      const clock = generateVietnamChart(input);
      const corrected = generateVietnamChart({ ...input, timeMode });
      expect(clock.chart.lunarInfo.fourPillars?.slice(0, 2)).toEqual(expected);
      expect(corrected.chart.lunarInfo.fourPillars?.slice(0, 2)).toEqual(
        expected,
      );
      expect(corrected.timing.correctionMinutes).not.toBe(0);
      expect(corrected.timing.minute).not.toBe(clock.timing.minute);
    },
  );

  it("uses the original civil date for solar terms while solar correction changes placement date/hour", () => {
    const result = generateVietnamChart({
      ...base,
      year: 2024,
      month: 2,
      day: 5,
      clockHour: 0,
      clockMinute: 10,
      longitude: -180,
      timeMode: "mean-solar",
    });
    expect(result.chart.lunarInfo.fourPillars?.slice(0, 2)).toEqual([
      "甲辰",
      "丙寅",
    ]);
    expect(result.timing).toMatchObject({
      chartDate: { year: 2024, month: 2, day: 4 },
      hour: 5,
      minute: 10,
      branch: 3,
      dayOffset: -1,
    });
    expect(result.chart.birthInfo).toMatchObject({
      year: 2024,
      month: 2,
      day: 4,
      hour: 3,
    });
    expect(result.chart.lunarInfo.fourPillars?.slice(2)).toEqual(
      getLunarInfo(2024, 2, 4, 3).fourPillars?.slice(2),
    );
  });

  it("advances nominal age at Vietnamese lunar new-year midnight in UTC+7", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2024-02-09T16:59:00Z"));
      expect(generateVietnamChart(base).chart.currentAge).toBe(17);
      vi.setSystemTime(new Date("2024-02-09T17:00:00Z"));
      expect(generateVietnamChart(base).chart.currentAge).toBe(18);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([0, 1, 3, 6, 8, 11])(
    "keeps all star positions unchanged when Vietnam/China calendars agree, branch%i",
    (hour) => {
      const legacy = generateChart({
        year: 2024,
        month: 2,
        day: 20,
        hour,
        gender: "male",
      });
      const vietnam = generateVietnamChart({
        ...base,
        year: 2024,
        month: 2,
        day: 20,
        clockHour: hour * 2,
      }).chart;
      const positions = (chart: typeof legacy) =>
        chart.palaces
          .flatMap((p) =>
            p.stars.map((s) => `${s.name}:${p.branch}:${s.siHua ?? ""}`),
          )
          .sort();
      expect(positions(vietnam)).toEqual(positions(legacy));
      expect(vietnam.daXians).toEqual(legacy.daXians);
    },
  );

  it("preserves legacy no-profile Chinese lunar calculation and default leap policy", () => {
    const birth = {
      year: 2007,
      month: 2,
      day: 17,
      hour: 6,
      gender: "male" as const,
    };
    const legacy = generateChart(birth);
    expect(legacy.lunarInfo).toMatchObject({
      lunarYear: 2006,
      lunarMonth: 12,
      lunarDay: 30,
    });
    expect(legacy).toEqual(generateChart(birth, { leapMonth: "split" }));
    expect(legacy.mingGongBranch).toBe(7);
  });

  it("rejects engine overrides that disagree with the actual Vietnam civil birth date", () => {
    expect(() =>
      generateChart(
        { year: 2007, month: 2, day: 17, hour: 6, gender: "male" },
        {
          vietnam: {
            lunarDate: { year: 2006, month: 12, day: 30, isLeapMonth: false },
            hour: 12,
            minute: 0,
            civilDate: { year: 2007, month: 2, day: 17 },
            originalCivilTime: {
              year: 2007,
              month: 2,
              day: 17,
              clockHour: 12,
              clockMinute: 0,
            },
          },
        },
      ),
    ).toThrow(RangeError);
  });

  it.each([
    { hour: 24 },
    { minute: 60 },
    { hour: 0 },
    { civilDate: { year: 2007, month: 2, day: 30 } },
    { civilDate: { year: 2007, month: 2, day: 15 } },
    {
      originalCivilTime: {
        year: 2007,
        month: 2,
        day: 30,
        clockHour: 12,
        clockMinute: 0,
      },
    },
    {
      originalCivilTime: {
        year: 2007,
        month: 2,
        day: 17,
        clockHour: 24,
        clockMinute: 0,
      },
    },
    {
      originalCivilTime: {
        year: 2007,
        month: 2,
        day: 17,
        clockHour: 12,
        clockMinute: 60,
      },
    },
  ])("rejects mismatched engine timing metadata %j", (patch) => {
    expect(() =>
      generateChart(
        { year: 2007, month: 2, day: 17, hour: 6, gender: "male" },
        {
          vietnam: {
            lunarDate: { year: 2007, month: 1, day: 1, isLeapMonth: false },
            hour: 12,
            minute: 0,
            civilDate: { year: 2007, month: 2, day: 17 },
            originalCivilTime: {
              year: 2007,
              month: 2,
              day: 17,
              clockHour: 12,
              clockMinute: 0,
            },
            ...patch,
          },
        },
      ),
    ).toThrow(RangeError);
  });
});
