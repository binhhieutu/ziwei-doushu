import type { ZiweiChart } from '../ziwei/types';

export interface VietnamDate {
  year: number;
  month: number;
  day: number;
}

export interface VietnamLunarDate extends VietnamDate {
  isLeapMonth: boolean;
}

/** Civil input uses a fixed UTC+7 profile, not historical time-zone reconstruction. */
export interface VietnamBirthInput extends VietnamDate {
  clockHour: number;
  clockMinute: number;
  gender: 'male' | 'female';
  name?: string;
  birthplace?: string;
  longitude?: number;
  timeMode: 'clock' | 'mean-solar' | 'apparent-solar';
  lateTyRule: 'next-day' | 'current-day';
  unknownTime: boolean;
}

export interface VietnamChartResult {
  input: VietnamBirthInput;
  chart: ZiweiChart;
  timing: {
    branch: number;
    hour: number;
    minute: number;
    dayOffset: number;
    chartDate: VietnamDate;
    correctionMinutes: number;
  };
}
