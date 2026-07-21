"use client";

import { useState } from "react";

import type { EstimateResult, GapField, UploadedFileMeta } from "@/lib/types";

interface GapPanelProps {
  gaps: GapField[];
  sessionId: string;
  flow: EstimateResult["flow"];
  year: number;
  file: UploadedFileMeta;
  onResult: (result: EstimateResult) => void;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
}

export function GapPanel({
  gaps,
  sessionId,
  flow,
  year,
  file,
  onResult,
  onError,
  onLoading,
}: GapPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Record<string, string>>({});

  if (gaps.length === 0) {
    return (
      <div className="gap-panel">
        <div className="gap-empty">No open gaps — manifest coverage is sufficient.</div>
      </div>
    );
  }

  const handleSubmit = async () => {
    const pending = Object.fromEntries(
      Object.entries(answers).filter(([, v]) => v.trim().length > 0),
    );
    const filled = { ...resolved, ...pending };

    if (Object.keys(filled).length === 0) {
      onError("Provide at least one gap answer before re-running.");
      return;
    }

    onLoading(true);
    onError("");

    try {
      const response = await fetch("/api/gap-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          flow,
          year,
          file,
          gapAnswers: filled,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Gap answer failed");
      }

      setResolved(filled);
      setAnswers({});
      onResult(data as EstimateResult);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Gap answer failed");
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="gap-panel">
      {gaps.map((gap) => (
        <div key={gap.id} className="gap-item">
          <div className="gap-item-header">
            <strong>{gap.label}</strong>
            <span className={`impact-badge impact-${gap.impact}`}>{gap.impact}</span>
          </div>
          <p className="gap-description">{gap.description}</p>
          <div className="gap-answer-row">
            <input
              type="text"
              placeholder="Your answer…"
              value={answers[gap.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [gap.id]: e.target.value }))
              }
              aria-label={`Answer for ${gap.label}`}
            />
          </div>
        </div>
      ))}
      <div className="gap-actions">
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          Re-run estimate with answers
        </button>
      </div>
    </div>
  );
}
