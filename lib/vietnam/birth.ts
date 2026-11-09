import { generateChart } from "../ziwei/algorithm";
import {
  branchFromSolarMinutes,
  equationOfTimeMinutes,
  shiftGregorianDate,
} from "../ziwei/true-solar-time";
import { assertVietnamSolarDate, solarToVietnamLunar } from "./calendar";
import type { VietnamBirthInput, VietnamChartResult } from "./types";

function validateInput(input: VietnamBirthInput): void {
  assertVietnamSolarDate(input);
  if (
    !Number.isInteger(input.clockHour) ||
    input.clockHour < 0 ||
    input.clockHour > 23 ||
    !Number.isInteger(input.clockMinute) ||
    input.clockMinute < 0 ||
    input.clockMinute > 59 ||
    (input.gender !== "male" && input.gender !== "female") ||
    !["clock", "mean-solar", "apparent-solar"].includes(input.timeMode) ||
    !["next-day", "current-day"].includes(input.lateTyRule) ||
    typeof input.unknownTime !== "boolean"
  ) {
    throw new RangeError(
      "Giờ sinh, giới tính hoặc quy ước tính giờ không hợp lệ.",
    );
  }
  if (
    (input.longitude !== undefined &&
      (!Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180)) ||
    (input.timeMode !== "clock" && input.longitude === undefined)
  ) {
    throw new RangeError(
      "Cần kinh độ hợp lệ từ −180° đến 180° để hiệu chỉnh giờ mặt trời.",
    );
  }
  if (
    (input.name !== undefined &&
      (typeof input.name !== "string" || input.name.length > 100)) ||
    (input.birthplace !== undefined &&
      (typeof input.birthplace !== "string" || input.birthplace.length > 200))
  ) {
    throw new RangeError("Tên hoặc nơi sinh vượt quá độ dài cho phép.");
  }
}

function resolveTiming(input: VietnamBirthInput): VietnamChartResult["timing"] {
  const meanCorrection =
    input.timeMode === "clock" ? 0 : (input.longitude! - 105) * 4;
  const equation =
    input.timeMode === "apparent-solar"
      ? equationOfTimeMinutes(
          input.year,
          input.month,
          input.day,
          input.clockHour,
          input.clockMinute,
        )
      : 0;
  const correctionMinutes = meanCorrection + equation;
  // Input is minute-resolution; round derived corrections to the nearest second
  // before both display and branch decisions, matching the existing solar helper.
  const rawSeconds = Math.round(
    (input.clockHour * 60 + input.clockMinute + correctionMinutes) * 60,
  );
  const solarDayOffset = Math.floor(rawSeconds / 86400);
  const secondOfDay = ((rawSeconds % 86400) + 86400) % 86400;
  const normalizedMinutes = secondOfDay / 60;
  const branch = branchFromSolarMinutes(normalizedMinutes);
  const dayOffset =
    solarDayOffset +
    (input.lateTyRule === "next-day" && normalizedMinutes >= 1380 ? 1 : 0);
  const chartDate = shiftGregorianDate(input, dayOffset);
  assertVietnamSolarDate(chartDate);
  return {
    branch,
    hour: Math.floor(secondOfDay / 3600),
    minute: Math.floor((secondOfDay % 3600) / 60),
    dayOffset,
    chartDate,
    correctionMinutes,
  };
}

export function generateVietnamChart(
  input: VietnamBirthInput,
): VietnamChartResult {
  validateInput(input);
  const timing = resolveTiming(input);
  const rawLunar = solarToVietnamLunar(timing.chartDate);
  const chart = generateChart(
    {
      ...timing.chartDate,
      hour: timing.branch,
      gender: input.gender,
      name: input.name,
      city: input.birthplace,
      longitude: input.longitude,
      calendarProfile: "vietnam-utc7",
      unknownTime: input.unknownTime,
      timeMode: input.timeMode,
      lateTyRule: input.lateTyRule,
      origInput: {
        year: input.year,
        month: input.month,
        day: input.day,
        clockHour: input.clockHour,
        clockMinute: input.clockMinute,
      },
    },
    {
      vietnam: {
        lunarDate: rawLunar,
        hour: timing.hour,
        minute: timing.minute,
        civilDate: shiftGregorianDate(
          input,
          timing.dayOffset -
            (input.lateTyRule === "next-day" && timing.hour === 23 ? 1 : 0),
        ),
        originalCivilTime: {
          year: input.year,
          month: input.month,
          day: input.day,
          clockHour: input.clockHour,
          clockMinute: input.clockMinute,
        },
      },
    },
  );
  return { input: { ...input }, chart, timing };
}
