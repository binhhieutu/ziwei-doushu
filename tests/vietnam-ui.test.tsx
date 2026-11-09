// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import ChartPage from "../app/chart/page";
import HemingPage from "../app/heming/page";

const generate = vi.fn((input) => ({
  input,
  timing: {
    branch: 0,
    hour: input.clockHour,
    minute: input.clockMinute,
    dayOffset: 0,
    correctionMinutes: 0,
    chartDate: { year: input.year, month: input.month, day: input.day },
  },
  chart: {
    birthInfo: input,
    lunarInfo: { lunarYear: 2000, lunarMonth: 1, lunarDay: 1 },
    mingGongBranch: 0,
    shenGongBranch: 1,
    wuxingJuName: "水二局",
    palaces: Array.from({ length: 12 }, (_, branch) => ({
      branch,
      stem: 0,
      name: branch === 0 ? "命宫" : "兄弟宫",
      stars: [{ name: "紫微", type: "major" }],
    })),
    daXians: [{ startAge: 2, endAge: 11, palaceBranch: 0, palaceName: "命宫" }],
    currentDaXianIndex: 0,
  },
}));
vi.mock("../lib/vietnam/birth", () => ({
  generateVietnamChart: (input: unknown) => generate(input),
}));

function fillForm(index = 0) {
  fireEvent.change(screen.getAllByLabelText("Ngày")[index], {
    target: { value: "1" },
  });
  fireEvent.change(screen.getAllByLabelText("Tháng")[index], {
    target: { value: "1" },
  });
  fireEvent.change(screen.getAllByLabelText("Năm")[index], {
    target: { value: "2000" },
  });
  fireEvent.change(screen.getAllByLabelText("Giờ")[index], {
    target: { value: "10" },
  });
  fireEvent.change(screen.getAllByLabelText("Phút")[index], {
    target: { value: "30" },
  });
}

describe("Giao diện lá số", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    generate.mockClear();
    vi.restoreAllMocks();
  });
  it("requires a valid date and an explicit assumed hour when birth time is unknown", async () => {
    render(<ChartPage />);
    fireEvent.click(screen.getByRole("button", { name: "Lập lá số" }));
    expect(generate).not.toHaveBeenCalled();
    fillForm();
    fireEvent.click(screen.getByLabelText("Không biết giờ sinh"));
    fireEvent.click(screen.getByRole("button", { name: "Lập lá số" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/chọn giờ giả định/i);
    fireEvent.change(screen.getByLabelText("Giờ giả định"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lập lá số" }));
    expect(await screen.findByText(/tạm tính/i)).toBeInTheDocument();
    expect(generate).toHaveBeenCalledOnce();
  });
  it("shows a Vietnamese palace without requesting AI until explicitly asked", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<ChartPage />);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Lập lá số" }));
    fireEvent.click(
      await screen.findByRole("button", { name: /cung Mệnh.*Tý/i }),
    );
    expect(screen.getByText(/chi tiết cung/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("renders two locally calculated charts before requesting compatibility", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<HemingPage />);
    fillForm(0);
    fillForm(1);
    fireEvent.click(screen.getByRole("button", { name: "Lập hai lá số" }));
    await waitFor(() => expect(generate).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole("button", { name: "Người thứ nhất" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Người thứ hai" }),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

it("sends the displayed period, clears old readings, and blocks invalid year drafts", async () => {
  const fetchSpy = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(
      async () =>
        new Response(
          'data: {"delta":{"text":"Luận giải cũ"}}\n\ndata: [DONE]\n\n',
        ),
    );
  render(<ChartPage />);
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Lập lá số" }));
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu luận giải" }));
  await screen.findByText("Luận giải cũ");
  expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)).view).toEqual({
    mode: "natal",
  });
  fireEvent.click(screen.getByRole("button", { name: "Đại hạn" }));
  expect(screen.queryByText("Luận giải cũ")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu luận giải" }));
  await screen.findByText("Luận giải cũ");
  expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body)).view).toEqual({
    mode: "decade",
    decadeIndex: 0,
  });
  fireEvent.click(screen.getByRole("button", { name: "Lưu niên" }));
  fireEvent.change(screen.getByLabelText("Năm lưu niên"), {
    target: { value: "" },
  });
  expect(screen.getByRole("alert")).toHaveTextContent(/1900.*2200/);
  expect(
    screen.queryByRole("button", { name: "Yêu cầu luận giải" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText(/Lưu niên 0/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Năm lưu niên"), {
    target: { value: "99999" },
  });
  expect(
    screen.queryByRole("button", { name: "Yêu cầu luận giải" }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Năm lưu niên"), {
    target: { value: "2024" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu luận giải" }));
  await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3));
  expect(JSON.parse(String(fetchSpy.mock.calls[2][1]?.body)).view).toEqual({
    mode: "year",
    year: 2024,
  });
  expect(screen.getByText("Đang xem: Lưu niên 2024")).toBeInTheDocument();
  cleanup();
  vi.restoreAllMocks();
});

it("aborts a pending reading when changing the selected period", async () => {
  let signal: AbortSignal | undefined;
  vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
    signal = options?.signal ?? undefined;
    return new Promise((_resolve, reject) =>
      signal?.addEventListener("abort", () =>
        reject(new DOMException("Đã hủy", "AbortError")),
      ),
    );
  });
  render(<ChartPage />);
  fillForm();
  fireEvent.click(screen.getByRole("button", { name: "Lập lá số" }));
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu luận giải" }));
  expect(signal?.aborted).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Đại hạn" }));
  expect(signal?.aborted).toBe(true);
  expect(
    screen.queryByRole("button", { name: "Hủy luận giải" }),
  ).not.toBeInTheDocument();
  cleanup();
  vi.restoreAllMocks();
});
