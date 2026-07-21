"use client";

import { useCallback, useEffect, useState } from "react";

import type { EstimateResult, FlowType } from "@/lib/types";

import { FileUpload } from "./FileUpload";
import { FlowSelector } from "./FlowSelector";
import { ResultsView } from "./ResultsView";
import { YearToggle } from "./YearToggle";

interface RatesResponse {
  defaultYear: number;
  years: number[];
  rates: Record<number, number>;
}

export function EstimatorApp() {
  const [flow, setFlow] = useState<FlowType>("iia");
  const [year, setYear] = useState(2026);
  const [years, setYears] = useState<number[]>([2025, 2026, 2027]);
  const [rates, setRates] = useState<Record<number, number>>({ 2026: 362 });
  const [file, setFile] = useState<File | null>(null);
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
        // Fallback if rates API unavailable during SSR edge cases
        setRates({ 2025: 425.52, 2026: 362, 2027: 239 });
      });
  }, []);

  const handleResult = useCallback((data: EstimateResult) => {
    setResult(data);
    setIsMock(data.agentMode !== "live");
  }, []);

  const handleEstimate = useCallback(async () => {
    if (!file) {
      setError("Select a file to estimate.");
      return;
    }

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
  }, [file, flow, year, handleResult]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>IA Agent</h1>
        <p>VMO2/TCS Impact Assessment Estimation</p>
      </header>

      <div className="app-main">
        <aside className="panel">
          <section className="panel-section">
            <h2>Flow</h2>
            <FlowSelector value={flow} onChange={setFlow} disabled={loading} />
          </section>

          <section className="panel-section">
            <h2>Planning year</h2>
            <YearToggle
              years={years}
              rates={rates}
              value={year}
              onChange={setYear}
              disabled={loading}
            />
          </section>

          <section className="panel-section">
            <h2>Upload</h2>
            <FileUpload file={file} onFileChange={setFile} disabled={loading} />
          </section>

          <button
            type="button"
            className="btn btn-primary"
            disabled={loading || !file}
            onClick={handleEstimate}
          >
            {loading ? "Running estimate…" : "Run estimate"}
          </button>
        </aside>

        <section className="panel-results">
          {error && <div className="status-banner status-error">{error}</div>}
          {loading && (
            <div className="status-banner status-loading">
              Agent processing — numbers come from engine tools only…
            </div>
          )}

          {result && file ? (
            <ResultsView
              result={result}
              file={{
                name: file.name,
                type: file.type,
                size: file.size,
              }}
              onResult={handleResult}
              onError={setError}
              onLoading={setLoading}
              isMock={isMock}
            />
          ) : (
            !loading && (
              <div className="empty-state">
                <strong>No estimate yet</strong>
                <p>
                  Upload a Vision Card (IIA) or IA pack, select flow and year, then
                  run estimate.
                </p>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}
