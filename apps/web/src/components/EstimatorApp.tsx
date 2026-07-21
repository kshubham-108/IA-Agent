"use client";

import { useCallback, useEffect, useState } from "react";

import type { UploadedClassifiedFile } from "@/lib/classify-types";
import { deriveFlow, mergeChecklistState, pickPrimaryFile } from "@/lib/readiness";
import type { EstimateResult } from "@/lib/types";

import { ReadinessGate } from "./ReadinessGate";
import { ResultsView } from "./ResultsView";
import { YearToggle } from "./YearToggle";

interface RatesResponse {
  defaultYear: number;
  years: number[];
  rates: Record<number, number>;
}

export function EstimatorApp() {
  const [year, setYear] = useState(2026);
  const [years, setYears] = useState<number[]>([2025, 2026, 2027]);
  const [rates, setRates] = useState<Record<number, number>>({ 2026: 362 });
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => r.json())
      .then((data: RatesResponse) => {
        setYears(data.years);
        setRates(data.rates);
        setYear(data.defaultYear);
      })
      .catch(() => {
        setRates({ 2025: 425.52, 2026: 362, 2027: 239 });
      });
  }, []);

  const handleResult = useCallback((data: EstimateResult) => {
    setResult(data);
    setIsMock(data.agentMode !== "live");
  }, []);

  const handleSubmit = useCallback(
    async (files: UploadedClassifiedFile[]) => {
      const file = pickPrimaryFile(files);
      if (!file) {
        setError("Upload at least one document.");
        return;
      }

      const checklist = mergeChecklistState(files);
      const flow = deriveFlow(checklist);

      setPrimaryFile(file);
      setLoading(true);
      setError("");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("flow", flow);
        formData.append("year", String(year));

        const response = await fetch("/api/estimate", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Estimate failed");
        }

        handleResult(data as EstimateResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Estimate failed");
      } finally {
        setLoading(false);
      }
    },
    [year, handleResult],
  );

  const handleReset = useCallback(() => {
    setResult(null);
    setPrimaryFile(null);
    setError("");
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <h1>IA Agent</h1>
            <p>VMO2/TCS Impact Assessment Estimation</p>
          </div>
          <div className="header-year">
            <span className="header-year-label">Planning year</span>
            <YearToggle
              years={years}
              rates={rates}
              value={year}
              onChange={setYear}
              disabled={loading}
            />
          </div>
        </div>
      </header>

      {!result ? (
        <main className="gate-main">
          {error && <div className="status-banner status-error gate-error">{error}</div>}
          {loading && (
            <div className="status-banner status-loading gate-loading">
              Agent processing — numbers come from engine tools only…
            </div>
          )}
          <ReadinessGate onSubmit={handleSubmit} disabled={loading} />
        </main>
      ) : (
        <div className="app-main app-main-results">
          <section className="panel-results">
            {error && <div className="status-banner status-error">{error}</div>}
            <div className="results-toolbar">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
              >
                ← Back to readiness gate
              </button>
            </div>
            {primaryFile && (
              <ResultsView
                result={result}
                file={{
                  name: primaryFile.name,
                  type: primaryFile.type,
                  size: primaryFile.size,
                }}
                onResult={handleResult}
                onError={setError}
                onLoading={setLoading}
                isMock={isMock}
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
