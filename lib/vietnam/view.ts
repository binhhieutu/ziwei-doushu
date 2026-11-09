import { getSiHuaByStem, getYearStemIndex } from "../ziwei/sihua";
import type { SiHua, ZiweiChart } from "../ziwei/types";

export type VietnamChartView =
  | { mode: "natal" }
  | { mode: "year"; year: number }
  | { mode: "decade"; decadeIndex: number };

export interface ResolvedVietnamView {
  mode: VietnamChartView["mode"];
  label: string;
  stemIndex: number;
  transforms: Record<SiHua, string>;
  year?: number;
  decadeIndex?: number;
  startAge?: number;
  endAge?: number;
  palaceBranch?: number;
}

/** Derive overlays from the canonical chart; period selection never supplies star data. */
export function resolveVietnamView(
  chart: ZiweiChart,
  view: VietnamChartView = { mode: "natal" },
): ResolvedVietnamView {
  if (view.mode === "year") {
    if (!Number.isInteger(view.year) || view.year < 1900 || view.year > 2200)
      throw new RangeError("Năm lưu niên phải nằm trong 1900–2200.");
    const stemIndex = getYearStemIndex(view.year);
    return {
      mode: "year",
      label: "Lưu niên",
      year: view.year,
      stemIndex,
      transforms: getSiHuaByStem(stemIndex),
    };
  }
  if (view.mode === "decade") {
    if (
      !Number.isInteger(view.decadeIndex) ||
      view.decadeIndex < 0 ||
      view.decadeIndex > 11
    )
      throw new RangeError("Chỉ số đại hạn không hợp lệ.");
    const decade = chart.daXians[view.decadeIndex];
    const palace =
      decade &&
      chart.palaces.find((item) => item.branch === decade.palaceBranch);
    if (!decade || !palace)
      throw new RangeError("Đại hạn không tồn tại trong lá số.");
    return {
      mode: "decade",
      label: "Đại hạn",
      decadeIndex: view.decadeIndex,
      startAge: decade.startAge,
      endAge: decade.endAge,
      palaceBranch: decade.palaceBranch,
      stemIndex: palace.stem,
      transforms: getSiHuaByStem(palace.stem),
    };
  }
  const stemIndex = chart.lunarInfo.yearStem;
  return {
    mode: "natal",
    label: "Nguyên cục",
    stemIndex,
    transforms: getSiHuaByStem(stemIndex),
  };
}
