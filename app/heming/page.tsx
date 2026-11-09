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

export default function HemingPage() {
  const [a, setA] = useState(emptyBirth);
  const [b, setB] = useState(emptyBirth);
  const [results, setResults] = useState<
    [VietnamChartResult, VietnamChartResult] | null
  >(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const birthA = parseBirth(a);
      const birthB = parseBirth(b);
      setResults([generateVietnamChart(birthA), generateVietnamChart(birthB)]);
      setActive(0);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lập hai lá số.");
    }
  }
  return (
    <div className="viet-page">
      <header className="viet-intro">
        <p className="viet-eyebrow">TỬ VI VIỆT</p>
        <h1>Đối chiếu hai lá số</h1>
        <p>
          Lập hai lá số để tự xem trước, sau đó yêu cầu luận giải về điểm tương
          đồng và cách tương tác nếu muốn.
        </p>
      </header>
      <form onSubmit={submit} noValidate>
        <div className="viet-pair">
          <BirthFields legend="Người thứ nhất" value={a} onChange={setA} />
          <BirthFields legend="Người thứ hai" value={b} onChange={setB} />
        </div>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="viet-primary">
          Lập hai lá số
        </button>
      </form>
      {results && (
        <>
          <div className="viet-tabs" role="group" aria-label="Chọn lá số">
            {results.map((r, i) => (
              <button
                type="button"
                key={i}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
              >
                {i === 0 ? "Người thứ nhất" : "Người thứ hai"}
              </button>
            ))}
          </div>
          <VietnamBoard key={active} result={results[active]} />
          <p className="viet-hint">
            Đối chiếu AI dựa trên nguyên cục của hai lá số.
          </p>
          <AIReading
            key={JSON.stringify(results.map((r) => r.input))}
            endpoint="/api/heming"
            payload={{ birthA: results[0].input, birthB: results[1].input }}
          />
        </>
      )}
    </div>
  );
}
