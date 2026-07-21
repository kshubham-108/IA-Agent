"use client";

import { downloadEcareDeck } from "@/lib/export-ecare";
import { formatGbp, formatPercent, formatPu } from "@/lib/format";
import type { EstimateResult, UploadedFileMeta } from "@/lib/types";

import { GapPanel } from "./GapPanel";
import { LineItems } from "./LineItems";

interface ResultsViewProps {
  result: EstimateResult;
  file: UploadedFileMeta;
  onResult: (result: EstimateResult) => void;
  onError: (message: string) => void;
  onLoading: (loading: boolean) => void;
  isMock: boolean;
}

export function ResultsView({
  result,
  file,
  onResult,
  onError,
  onLoading,
  isMock,
}: ResultsViewProps) {
  const { headline, confidence } = result;

  return (
    <>
      <div className="results-header">
        <div>
          <h2>
            {result.projectName}
            {isMock && <span className="mock-badge">Mock agent</span>}
          </h2>
          <p className="meta">
            {result.flow === "iia" ? "IIA / Seed Funding" : "IA (post-HLD)"} ·{" "}
            {result.year} @ £{result.pur}/PU
          </p>
        </div>
        <div className="actions-row">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => downloadEcareDeck(result)}
          >
            Export eCare deck
          </button>
        </div>
      </div>

      <div className="headline-grid">
        <div className="metric-card">
          <div className="label">Person Units</div>
          <div className="value">{formatPu(headline.pu)}</div>
          <div className="sub">1 PU = 1 blended person-day</div>
        </div>
        <div className="metric-card">
          <div className="label">Cost</div>
          <div className="value">{formatGbp(headline.costGbp)}</div>
          <div className="sub">PUR × PU (engine-computed)</div>
        </div>
        <div className="metric-card">
          <div className="label">Duration</div>
          <div className="value">{headline.duration}</div>
        </div>
        <div className="metric-card">
          <div className="label">Band</div>
          <div className="value">{headline.band}</div>
        </div>
      </div>

      <div className="confidence-bar">
        <h3>
          Confidence band · {formatPercent(confidence.coverage)} manifest coverage
        </h3>
        <div className="confidence-range">
          <span>
            {formatPu(confidence.lowPu)} – {formatPu(confidence.highPu)} PU
          </span>
          <span>
            {formatGbp(confidence.lowGbp)} – {formatGbp(confidence.highGbp)}
          </span>
        </div>
      </div>

      <h3 className="section-title">Line items</h3>
      <LineItems items={result.lineItems} />

      <h3 className="section-title">Gap report</h3>
      <GapPanel
        gaps={result.gaps}
        sessionId={result.sessionId}
        flow={result.flow}
        year={result.year}
        file={file}
        onResult={onResult}
        onError={onError}
        onLoading={onLoading}
      />
    </>
  );
}
