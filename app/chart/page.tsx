"use client";
import { useState } from "react";
import {
  BirthFields,
  emptyBirth,
  parseBirth,
} from "@/components/vietnam/BirthFields";
import { VietnamBoard } from "@/components/vietnam/VietnamBoard";
import { AIReading } from "@/components/vietnam/AIReading";
import { generateVietnamChart } from "@/lib/vietnam/birth";
import type { VietnamChartResult } from "@/lib/vietnam/types";
import type { VietnamChartView } from "@/lib/vietnam/view";

export default function ChartPage() {
  const [draft, setDraft] = useState(emptyBirth);
  const [result, setResult] = useState<VietnamChartResult | null>(null);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState(0);
  const [topic, setTopic] = useState("overview");
  const [chartVersion, setChartVersion] = useState(0);
  const [view, setView] = useState<VietnamChartView | null>({ mode: "natal" });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const next = generateVietnamChart(parseBirth(draft));
      setResult(next);
      setChartVersion((version) => version + 1);
      setView({ mode: "natal" });
      setBranch(next.chart.mingGongBranch);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể lập lá số. Vui lòng kiểm tra thông tin.",
      );
    }
  }
  return (
    <div className="viet-page">
      <header className="viet-intro">
        <p className="viet-eyebrow">TỬ VI VIỆT</p>
        <h1>Lập lá số tử vi</h1>
        <p>
          Nhập thông tin sinh để lập lá số theo lịch Việt Nam. Bạn có thể xem lá
          số ngay mà không cần luận giải AI.
        </p>
      </header>
      <form onSubmit={submit} noValidate>
        <BirthFields value={draft} onChange={setDraft} />
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="viet-primary">
          Lập lá số
        </button>
      </form>
      {result && (
        <>
          <VietnamBoard
            key={chartVersion}
            result={result}
            onSelect={setBranch}
            onViewChange={setView}
          />
          <label className="viet-control">
            Chủ đề luận giải
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="overview">Tổng quan</option>
              <option value="career">Sự nghiệp</option>
              <option value="relationships">Tình cảm và quan hệ</option>
              <option value="wealth">Tài chính</option>
              <option value="health">Sức khỏe</option>
              <option value="palace">Cung đang chọn</option>
            </select>
          </label>
          {view && (
            <AIReading
              key={JSON.stringify([
                result.input,
                chartVersion,
                topic,
                view,
                topic === "palace" ? branch : null,
              ])}
              endpoint="/api/interpret"
              payload={{
                birth: result.input,
                topic,
                view,
                ...(topic === "palace" ? { palaceBranch: branch } : {}),
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
