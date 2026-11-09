import { astro } from "iztro";
import { Solar } from "lunar-javascript";
import { SolarDate } from "@nghiavuive/lunar_date_vi";
import { BRANCHES, STEMS } from "../ziwei/constants";
import type { LunarInfo, VietnamCalendarOptions } from "../ziwei/types";
import { branchFromSolarMinutes } from "../ziwei/true-solar-time";
import { assertVietnamSolarDate, solarToVietnamLunar } from "./calendar";
import type { VietnamDate, VietnamLunarDate } from "./types";

const mod = (value: number, base = 12) => ((value % base) + base) % base;

export function validateVietnamProfile(
  date: VietnamDate,
  branch: number,
  profile: VietnamCalendarOptions,
): void {
  const actual = solarToVietnamLunar(date);
  assertVietnamSolarDate(profile.civilDate);
  assertVietnamSolarDate(profile.originalCivilTime);
  const original = profile.originalCivilTime;
  const civil = profile.civilDate;
  const dayDifference =
    (Date.UTC(date.year, date.month - 1, date.day) -
      Date.UTC(civil.year, civil.month - 1, civil.day)) /
    86400000;
  if (
    !profile.lunarDate ||
    (["year", "month", "day", "isLeapMonth"] as const).some(
      (key) => actual[key] !== profile.lunarDate[key],
    ) ||
    !Number.isInteger(profile.hour) ||
    profile.hour < 0 ||
    profile.hour > 23 ||
    !Number.isInteger(profile.minute) ||
    profile.minute < 0 ||
    profile.minute > 59 ||
    !Number.isInteger(original.clockHour) ||
    original.clockHour < 0 ||
    original.clockHour > 23 ||
    !Number.isInteger(original.clockMinute) ||
    original.clockMinute < 0 ||
    original.clockMinute > 59 ||
    branchFromSolarMinutes(profile.hour * 60 + profile.minute) !== branch ||
    (dayDifference !== 0 && !(profile.hour === 23 && dayDifference === 1))
  ) {
    throw new RangeError(
      "Dữ liệu lịch Việt Nam và ngày giờ an số không nhất quán.",
    );
  }
}

/** Month used for placement only. Raw leap date remains in lunarInfo. */
export function vietnamPlacementMonth(lunar: VietnamLunarDate): number {
  return (
    mod(lunar.month - 1 + (lunar.isLeapMonth && lunar.day > 15 ? 1 : 0)) + 1
  );
}

/**
 * iztro.byLunar reconstructs a Chinese civil date, so it cannot represent all
 * Vietnamese day30/leap-month inputs. Use a normal-month day1 scaffold for
 * year/month/hour rules only, then reconstruct ALL lunar-day-dependent stars.
 * The14major and4daily placements below follow the audited MIT iztro formulas
 * (lib/star/location.js:getStartIndex/getDailyStarIndex, majorStar.js).
 * This internal scaffold date is never used as birth metadata or day pillars.
 */
export function vietnamPlacement(
  lunar: VietnamLunarDate,
  hour: number,
  gender: "男" | "女",
) {
  const month = vietnamPlacementMonth(lunar);
  const scaffold = astro.byLunar(
    `${lunar.year}-${month}-1`,
    hour,
    gender,
    false,
    false,
    "zh-CN",
  );
  const value = Number(
    scaffold.fiveElementsClass
      .match(/[二三四五六]/)?.[0]
      ?.replace("二", "2")
      .replace("三", "3")
      .replace("四", "4")
      .replace("五", "5")
      .replace("六", "6"),
  );
  const offset = (value - (lunar.day % value)) % value;
  const ziwei = mod(
    (lunar.day + offset) / value - 1 + (offset % 2 === 0 ? offset : -offset),
  );
  const tianfu = mod(-ziwei);
  const majorGroups = [
    {
      start: ziwei,
      direction: -1,
      names: ["紫微", "天机", "", "太阳", "武曲", "天同", "", "", "廉贞"],
    },
    {
      start: tianfu,
      direction: 1,
      names: [
        "天府",
        "太阴",
        "贪狼",
        "巨门",
        "天相",
        "天梁",
        "七杀",
        "",
        "",
        "",
        "破军",
      ],
    },
  ];
  const majorPositions = new Map(
    majorGroups.flatMap((group) =>
      group.names.flatMap((name, i) =>
        name ? [[name, mod(group.start + group.direction * i)] as const] : [],
      ),
    ),
  );
  const dailyPositions = new Map([
    ["三台", mod(4 + month - 1 + lunar.day - 1 - 2)],
    ["八座", mod(10 - (month - 1) - (lunar.day - 1) - 2)],
    ["恩光", mod(10 - hour + lunar.day - 2 - 2)],
    ["天贵", mod(4 + hour + lunar.day - 2 - 2)],
  ]);
  const majorStars = scaffold.palaces.flatMap((p) => p.majorStars);
  const dailyStars = scaffold.palaces
    .flatMap((p) => p.adjectiveStars)
    .filter((s) => dailyPositions.has(s.name));
  return {
    ...scaffold,
    palaces: scaffold.palaces.map((p, i) => ({
      ...p,
      majorStars: majorStars.filter((s) => majorPositions.get(s.name) === i),
      adjectiveStars: [
        ...p.adjectiveStars.filter((s) => !dailyPositions.has(s.name)),
        ...dailyStars.filter((s) => dailyPositions.get(s.name) === i),
      ],
    })),
  };
}

export function vietnamLunarInfo(
  date: VietnamDate,
  profile: VietnamCalendarOptions,
  base: LunarInfo,
): LunarInfo {
  const lunar = solarToVietnamLunar(date);
  const yearStem = mod(lunar.year - 4, 10);
  const yearBranch = mod(lunar.year - 4);
  const yearPillar = `${STEMS[yearStem]}${BRANCHES[yearBranch]}`;
  const monthStem = mod((yearStem % 5) * 2 + lunar.month + 1, 10);
  const monthPillar = `${STEMS[monthStem]}${BRANCHES[(lunar.month + 1) % 12]}`;
  // Day/hour pillars use the real chart date. The base uses that exact civil
  // date, never the Chinese scaffold, and already implements five-rat hour stems.
  const dayPillar = base.fourPillars![2];
  const timePillar = base.fourPillars![3];
  // Solar terms describe the physical birth instant. A longitude/equation-of-
  // time correction changes the placement clock, not that instant. Convert the
  // ORIGINAL fixed UTC+7 civil input to lunar-javascript's UTC+8 timestamps.
  const civil = profile.originalCivilTime;
  const beijing = new Date(
    Date.UTC(
      civil.year,
      civil.month - 1,
      civil.day,
      civil.clockHour + 1,
      civil.clockMinute,
    ),
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ec = (Solar as any)
    .fromYmdHms(
      beijing.getUTCFullYear(),
      beijing.getUTCMonth() + 1,
      beijing.getUTCDate(),
      beijing.getUTCHours(),
      beijing.getUTCMinutes(),
      0,
    )
    .getLunar()
    .getEightChar();
  return {
    lunarYear: lunar.year,
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    isLeapMonth: lunar.isLeapMonth,
    yearStem,
    yearBranch,
    fourPillars: [ec.getYear(), ec.getMonth(), dayPillar, timePillar],
    fourPillarsLunar: [yearPillar, monthPillar, dayPillar, timePillar],
  };
}

export function vietnamNominalAge(
  birthLunarYear: number,
  now = new Date(),
): number {
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const current = new SolarDate({
    year: utc7.getUTCFullYear(),
    month: utc7.getUTCMonth() + 1,
    day: utc7.getUTCDate(),
  })
    .toLunarDate()
    .get();
  return current.year - birthLunarYear + 1;
}
