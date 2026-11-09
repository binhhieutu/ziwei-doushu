// @vitest-environment jsdom
import { it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import { VietnamBoard } from "../components/vietnam/VietnamBoard";
import type { VietnamChartResult } from "../lib/vietnam/types";

afterEach(cleanup);
it("updates the palace and its transformation consistently when switching time views", () => {
  const palaces = Array.from({ length: 12 }, (_, branch) => ({
    branch,
    stem: 0,
    name: branch === 0 ? "命宫" : "兄弟宫",
    stars: [{ name: "廉贞", type: "major" as const }],
  }));
  const result = {
    input: {
      year: 2000,
      month: 1,
      day: 1,
      clockHour: 10,
      clockMinute: 0,
      gender: "male",
      timeMode: "clock",
      lateTyRule: "next-day",
      unknownTime: false,
    },
    timing: {
      branch: 5,
      hour: 10,
      minute: 0,
      dayOffset: 0,
      chartDate: { year: 2000, month: 1, day: 1 },
      correctionMinutes: 0,
    },
    chart: {
      birthInfo: { year: 2000, month: 1, day: 1, hour: 5, gender: "male" },
      lunarInfo: {
        lunarYear: 1999,
        lunarMonth: 11,
        lunarDay: 25,
        yearStem: 0,
        yearBranch: 0,
        isLeapMonth: false,
      },
      mingGongBranch: 0,
      shenGongBranch: 1,
      wuxingJu: 2,
      wuxingJuName: "水二局",
      ziweiPos: 0,
      palaces,
      daXians: [
        { startAge: 2, endAge: 11, palaceBranch: 0, palaceName: "命宫" },
      ],
      currentAge: 27,
      currentDaXianIndex: 0,
    },
  } as VietnamChartResult;
  const selected = vi.fn();
  render(<VietnamBoard result={result} onSelect={selected} />);
  fireEvent.click(screen.getByRole("button", { name: "Cung Mệnh · Tý" }));
  expect(selected).toHaveBeenCalledWith(0);
  fireEvent.click(screen.getByRole("button", { name: "Đại hạn" }));
  expect(screen.getByLabelText("Chọn đại hạn")).toHaveValue("0");
  expect(screen.getByText(/Đang xem: Đại hạn/)).toBeInTheDocument();
  expect(
    within(screen.getByRole("button", { name: "Cung Mệnh · Tý" })).getByText(
      /Hạn Hóa/,
    ),
  ).toBeInTheDocument();
  expect(screen.queryAllByText(/Hóa Hóa/)).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Lưu niên" }));
  fireEvent.change(screen.getByLabelText("Năm lưu niên"), {
    target: { value: "2024" },
  });
  expect(screen.getByText("Đang xem: Lưu niên 2024")).toBeInTheDocument();
  expect(
    within(screen.getByRole("button", { name: "Cung Mệnh · Tý" })).getByText(
      /Năm Hóa/,
    ),
  ).toBeInTheDocument();
  expect(screen.queryAllByText(/Hóa Hóa/)).toHaveLength(0);
});
