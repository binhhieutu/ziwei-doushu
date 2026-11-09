// ISC-licensed @nghiavuive/lunar_date_vi2.0.1: Vietnamese calendar tables
// attributed upstream to Hồ Ngọc Đức. Keep this conversion separate from
// lunar-javascript/iztro's Chinese calendar and from civil time correction.
import { LunarDate, SolarDate } from '@nghiavuive/lunar_date_vi';
import { isValidGregorianDate } from '../ziwei/true-solar-time';
import type { VietnamDate, VietnamLunarDate } from './types';

const INVALID_SOLAR =
  'Ngày dương lịch không hợp lệ hoặc ngoài khoảng 1900–2050.';
const INVALID_LUNAR =
  'Ngày âm lịch Việt Nam không tồn tại hoặc ngoài phạm vi hỗ trợ.';

export function assertVietnamSolarDate(date: VietnamDate): void {
  if (
    !date ||
    date.year < 1900 ||
    date.year > 2050 ||
    !isValidGregorianDate(date.year, date.month, date.day)
  ) {
    throw new RangeError(INVALID_SOLAR);
  }
}

export function solarToVietnamLunar(date: VietnamDate): VietnamLunarDate {
  assertVietnamSolarDate(date);
  const lunar = new SolarDate(date).toLunarDate().get();
  return {
    year: lunar.year,
    month: lunar.month,
    day: lunar.day,
    isLeapMonth: lunar.leap_month,
  };
}

export function vietnamLunarToSolar(date: VietnamLunarDate): VietnamDate {
  if (
    !date ||
    !Number.isInteger(date.year) ||
    date.year < 1899 ||
    date.year > 2050 ||
    !Number.isInteger(date.month) ||
    date.month < 1 ||
    date.month > 12 ||
    !Number.isInteger(date.day) ||
    date.day < 1 ||
    date.day > 30 ||
    typeof date.isLeapMonth !== 'boolean'
  ) {
    throw new RangeError(INVALID_LUNAR);
  }
  try {
    const lunar = new LunarDate({ ...date, leap_month: date.isLeapMonth });
    lunar.init();
    const converted = lunar.toSolarDate().get();
    const solar = {
      year: converted.year,
      month: converted.month,
      day: converted.day,
    };
    // Upstream normalizes impossible leap flags and some day30 claims. Refuse
    // normalization, so callers cannot silently receive a different birth date.
    const check = solarToVietnamLunar(solar);
    if (
      check.year !== date.year ||
      check.month !== date.month ||
      check.day !== date.day ||
      check.isLeapMonth !== date.isLeapMonth
    )
      throw new RangeError(INVALID_LUNAR);
    return solar;
  } catch {
    throw new RangeError(INVALID_LUNAR);
  }
}
