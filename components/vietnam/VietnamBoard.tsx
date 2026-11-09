"use client";
import { useState } from "react";
import type { VietnamChartResult } from "@/lib/vietnam/types";
import { resolveVietnamView, type VietnamChartView } from "@/lib/vietnam/view";
import { VI_STEMS, VI_BRANCHES, viLabel } from "@/lib/i18n/vi";

type View = "natal" | "decade" | "year";
const ELEMENTS = [
  "Thủy",
  "Thổ",
  "Mộc",
  "Mộc",
  "Thổ",
  "Hỏa",
  "Hỏa",
  "Thổ",
  "Kim",
  "Kim",
  "Thổ",
  "Thủy",
];
const positions: Record<number, [number, number]> = {
  5: [1, 1],
  6: [1, 2],
  7: [1, 3],
  8: [1, 4],
  4: [2, 1],
  9: [2, 4],
  3: [3, 1],
  10: [3, 4],
  2: [4, 1],
  1: [4, 2],
  0: [4, 3],
  11: [4, 4],
};
export function VietnamBoard({
  result,
  onSelect,
  onViewChange,
}: {
  result: VietnamChartResult;
  onSelect?: (branch: number) => void;
  onViewChange?: (view: VietnamChartView | null) => void;
}) {
  const { chart, input, timing } = result;
  const [view, setView] = useState<View>("natal");
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearDraft, setYearDraft] = useState(String(new Date().getFullYear()));
  const [selected, setSelected] = useState(chart.mingGongBranch);
  const [decade, setDecade] = useState(Math.max(0, chart.currentDaXianIndex));
  function validYear(text: string): number | null {
    if (!/^\d{4}$/.test(text)) return null;
    const value = Number(text);
    return value >= 1900 && value <= 2200 ? value : null;
  }
  function changeView(next: View) {
    setView(next);
    if (next === "natal") onViewChange?.({ mode: "natal" });
    else if (next === "decade")
      onViewChange?.(
        chart.daXians[decade] ? { mode: "decade", decadeIndex: decade } : null,
      );
    else {
      const nextYear = validYear(yearDraft);
      onViewChange?.(
        nextYear === null ? null : { mode: "year", year: nextYear },
      );
    }
  }
  const dx = chart.daXians[decade];
  const decadePalace =
    dx && chart.palaces.find((p) => p.branch === dx.palaceBranch);
  const selectedView: VietnamChartView | null =
    view === "year"
      ? { mode: "year", year }
      : view === "decade" && decadePalace
        ? { mode: "decade", decadeIndex: decade }
        : null;
  const overlay = selectedView
    ? Object.fromEntries(
        Object.entries(resolveVietnamView(chart, selectedView).transforms).map(
          ([transformation, star]) => [star, transformation],
        ),
      )
    : {};
  const palace = chart.palaces.find((p) => p.branch === selected);
  const mode =
    view === "natal"
      ? "Nguyên cục"
      : view === "decade"
        ? "Đại hạn"
        : `Lưu niên ${year}`;
  return (
    <section aria-label="Lá số tử vi" className="viet-chart">
      <div className="viet-summary">
        <p className="viet-eyebrow">LÁ SỐ TỬ VI</p>
        <h2>
          {input.name || "Lá số của bạn"}
          {input.unknownTime ? " · Tạm tính" : ""}
        </h2>
        <p>
          {input.day}/{input.month}/{input.year} ·{" "}
          {String(input.clockHour).padStart(2, "0")}:
          {String(input.clockMinute).padStart(2, "0")}{" "}
          {input.unknownTime ? "(giờ giả định)" : ""}
        </p>
        <p>
          Âm lịch: {chart.lunarInfo.lunarDay}/
          {Math.abs(chart.lunarInfo.lunarMonth)}/{chart.lunarInfo.lunarYear}
          {chart.lunarInfo.isLeapMonth ? " (tháng nhuận)" : ""} · Giờ{" "}
          {VI_BRANCHES[timing.branch]}
        </p>
        <p>
          Giờ an số: {String(timing.hour).padStart(2, "0")}:
          {String(timing.minute).padStart(2, "0")} · Ngày an số:{" "}
          {timing.chartDate.day}/{timing.chartDate.month}/
          {timing.chartDate.year}
          {timing.correctionMinutes
            ? ` · hiệu chỉnh ${timing.correctionMinutes.toFixed(1)} phút`
            : ""}
        </p>
      </div>
      <div role="group" aria-label="Chế độ xem lá số" className="viet-tabs">
        {(
          [
            ["natal", "Nguyên cục"],
            ["decade", "Đại hạn"],
            ["year", "Lưu niên"],
          ] as const
        ).map(([key, label]) => (
          <button
            type="button"
            aria-pressed={view === key}
            key={key}
            onClick={() => changeView(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "decade" && (
        <label className="viet-control">
          Chọn đại hạn
          <select
            value={decade}
            onChange={(e) => {
              const index = Number(e.target.value);
              setDecade(index);
              onViewChange?.({ mode: "decade", decadeIndex: index });
            }}
          >
            {chart.daXians.map((d, i) => (
              <option key={i} value={i}>
                {d.startAge}–{d.endAge} tuổi · {viLabel(d.palaceName)}
              </option>
            ))}
          </select>
        </label>
      )}
      {view === "year" && (
        <label className="viet-control">
          Năm lưu niên
          <input
            type="number"
            min="1900"
            max="2200"
            value={yearDraft}
            onChange={(e) => {
              const draft = e.target.value;
              setYearDraft(draft);
              const nextYear = validYear(draft);
              if (nextYear !== null) setYear(nextYear);
              onViewChange?.(
                nextYear === null ? null : { mode: "year", year: nextYear },
              );
            }}
          />
        </label>
      )}
      {view === "year" && validYear(yearDraft) === null && (
        <p role="alert">Vui lòng nhập năm lưu niên từ 1900 đến 2200.</p>
      )}
      <p className="viet-hint">
        {mode}
        {view === "decade" && dx ? ` · ${dx.startAge}–${dx.endAge} tuổi` : ""}.
        Chọn một cung để xem chi tiết.
      </p>
      <div className="viet-board">
        {chart.palaces.map((p) => {
          const [row, col] = positions[p.branch];
          return (
            <button
              type="button"
              key={p.branch}
              className="viet-palace"
              style={{ gridRow: row, gridColumn: col }}
              aria-label={`Cung ${viLabel(p.name)} · ${VI_BRANCHES[p.branch]}`}
              aria-pressed={selected === p.branch}
              onClick={() => {
                setSelected(p.branch);
                onSelect?.(p.branch);
              }}
            >
              <strong>{viLabel(p.name)}</strong>
              <span>
                {VI_STEMS[p.stem]} {VI_BRANCHES[p.branch]} ·{" "}
                {ELEMENTS[p.branch]}
              </span>
              <span>
                {p.stars
                  .map(
                    (s) =>
                      `${viLabel(s.name)}${s.brightnessRaw ? ` (${viLabel(s.brightnessRaw)})` : ""}${s.siHua ? ` · ${viLabel(s.siHua)}` : ""}${overlay[s.name] ? ` · ${view === "year" ? "Năm" : "Hạn"} ${viLabel(overlay[s.name])}` : ""}`,
                  )
                  .join(", ") || "Không có sao"}
              </span>
              {p.daXianAge && (
                <small>
                  {p.daXianAge[0]}–{p.daXianAge[1]} tuổi
                </small>
              )}
            </button>
          );
        })}
        <div className="viet-center">
          <span aria-hidden="true">☯</span>
          <strong>{mode}</strong>
          <p>{viLabel(chart.wuxingJuName)}</p>
          <p>Mệnh tại {VI_BRANCHES[chart.mingGongBranch]}</p>
        </div>
      </div>
      {palace && (
        <div className="viet-detail" aria-live="polite">
          <h3>
            Chi tiết cung {viLabel(palace.name)} · {VI_BRANCHES[palace.branch]}
          </h3>
          <p>Đang xem: {mode}</p>
          <p>
            Can chi: {VI_STEMS[palace.stem]} {VI_BRANCHES[palace.branch]} · Hành{" "}
            {ELEMENTS[palace.branch]}
          </p>
          <p>
            Các sao:{" "}
            {palace.stars
              .map(
                (s) =>
                  `${viLabel(s.name)}${s.brightnessRaw ? ` (${viLabel(s.brightnessRaw)})` : ""}${s.siHua ? ` · ${viLabel(s.siHua)}` : ""}${overlay[s.name] ? ` · ${view === "year" ? "Năm" : "Hạn"} ${viLabel(overlay[s.name])}` : ""}`,
              )
              .join(", ") || "Không có sao"}
          </p>
          {palace.isShenGong && <p>Cung an Thân</p>}
        </div>
      )}
    </section>
  );
}
