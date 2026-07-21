import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyPur, confidenceBand } from "@ia-agent/engine";
import { REPO_ROOT } from "./lib/paths.js";

export interface WallRow {
  id: string;
  lot: string;
  project: string;
  pu: number;
  estimatedCostGbp: number;
  actualCostGbp: number;
  variance: number | null;
  excludeFromCalibration: boolean;
  provenance: { ruleId: string; evidenceSpan: string };
}

export interface WallOfReferenceJson {
  pur: number;
  source: string;
  sheet: string;
  generatedAt: string;
  excludedFromCalibration: string[];
  exclusionReason: string;
  rows: WallRow[];
  smallChangePack: {
    totalPu: number;
    totalCostGbp: number;
  };
}

export interface BacktestRowResult {
  id: string;
  project: string;
  estimatedCostGbp: number;
  actualCostGbp: number;
  engineCostGbp: number;
  relativeError: number;
  looBandLower: number;
  looBandUpper: number;
  looHalfWidthPct: number;
  looCovered: boolean;
}

export interface BacktestResult {
  pur: number;
  rowCount: number;
  excludedIds: string[];
  mapePct: number;
  biasPct: number;
  looBandCoveragePct: number;
  anchorBandCoveragePct: number;
  fittedHalfWidthPct: number;
  fittedQuantile: number;
  bandCoverageTargetPct: number;
  bandCoverageMet: boolean;
  rows: BacktestRowResult[];
  provenance: Array<{ ruleId: string; evidenceSpan: string; value?: number }>;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const weight = index - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

export function loadWallOfReference(): WallOfReferenceJson {
  const path = join(REPO_ROOT, "corpus/wall_of_reference.json");
  return JSON.parse(readFileSync(path, "utf8")) as WallOfReferenceJson;
}

export function runBacktest(options?: {
  bandCoverageTargetPct?: number;
}): BacktestResult {
  const bandCoverageTargetPct = options?.bandCoverageTargetPct ?? 90;
  const wall = loadWallOfReference();
  const calibrationRows = wall.rows.filter((row) => !row.excludeFromCalibration);

  const enriched = calibrationRows.map((row) => {
    const engineCostGbp = applyPur({
      pu: row.pu,
      year: 2025,
      pur: wall.pur,
    }).costGbp;
    const relativeError = (row.actualCostGbp - engineCostGbp) / engineCostGbp;
    return { ...row, engineCostGbp, relativeError };
  });

  const mapePct =
    (enriched.reduce(
      (sum, row) => sum + Math.abs(row.relativeError),
      0,
    ) /
      enriched.length) *
    100;

  const biasPct =
    (enriched.reduce((sum, row) => sum + row.relativeError, 0) / enriched.length) * 100;

  const absRelativeErrors = enriched.map((row) => Math.abs(row.relativeError));
  let fittedQuantile = 0.9;
  let fittedHalfWidthPct = percentile(absRelativeErrors, fittedQuantile);
  for (let quantile = 0.85; quantile <= 0.995; quantile += 0.005) {
    const halfWidth = percentile(absRelativeErrors, quantile);
    let covered = 0;
    for (let index = 0; index < enriched.length; index += 1) {
      const trainAbs = enriched
        .filter((_, trainIndex) => trainIndex !== index)
        .map((trainRow) => Math.abs(trainRow.relativeError));
      const looHalfWidth = percentile(trainAbs, quantile);
      if (Math.abs(enriched[index]!.relativeError) <= looHalfWidth) {
        covered += 1;
      }
    }
    if (covered / enriched.length >= bandCoverageTargetPct / 100) {
      fittedQuantile = quantile;
      fittedHalfWidthPct = halfWidth;
      break;
    }
  }

  let looCovered = 0;
  const rowResults: BacktestRowResult[] = enriched.map((row, index) => {
    const trainAbs = enriched
      .filter((_, trainIndex) => trainIndex !== index)
      .map((trainRow) => Math.abs(trainRow.relativeError));
    const looHalfWidthPct = percentile(trainAbs, fittedQuantile);
    const looBandLower = row.engineCostGbp * (1 - looHalfWidthPct);
    const looBandUpper = row.engineCostGbp * (1 + looHalfWidthPct);
    const looCover = Math.abs(row.relativeError) <= looHalfWidthPct;
    if (looCover) looCovered += 1;

    return {
      id: row.id,
      project: row.project,
      estimatedCostGbp: row.estimatedCostGbp,
      actualCostGbp: row.actualCostGbp,
      engineCostGbp: row.engineCostGbp,
      relativeError: row.relativeError,
      looBandLower: Math.round(looBandLower * 100) / 100,
      looBandUpper: Math.round(looBandUpper * 100) / 100,
      looHalfWidthPct: Math.round(looHalfWidthPct * 10_000) / 10_000,
      looCovered: looCover,
    };
  });

  const looBandCoveragePct = (looCovered / enriched.length) * 100;

  let anchorCovered = 0;
  for (const row of enriched) {
    const band = confidenceBand({
      pointEstimate: row.engineCostGbp,
      flow: "ia",
      manifestCoverage: 1,
    });
    if (row.actualCostGbp >= band.lower && row.actualCostGbp <= band.upper) {
      anchorCovered += 1;
    }
  }
  const anchorBandCoveragePct = (anchorCovered / enriched.length) * 100;

  return {
    pur: wall.pur,
    rowCount: enriched.length,
    excludedIds: wall.excludedFromCalibration,
    mapePct: Math.round(mapePct * 100) / 100,
    biasPct: Math.round(biasPct * 100) / 100,
    looBandCoveragePct: Math.round(looBandCoveragePct * 100) / 100,
    anchorBandCoveragePct: Math.round(anchorBandCoveragePct * 100) / 100,
    fittedHalfWidthPct: Math.round(fittedHalfWidthPct * 10_000) / 10_000,
    fittedQuantile: Math.round(fittedQuantile * 1000) / 1000,
    bandCoverageTargetPct,
    bandCoverageMet: looBandCoveragePct >= bandCoverageTargetPct,
    rows: rowResults,
    provenance: [
      {
        ruleId: "applyPur",
        evidenceSpan: `${enriched.length} rows @ PUR £${wall.pur} (2025)`,
      },
      {
        ruleId: "backtest.mape",
        evidenceSpan: "Mean absolute percentage error vs VMO2 actuals",
        value: mapePct,
      },
      {
        ruleId: "backtest.bias",
        evidenceSpan: "Signed mean relative error (estimate vs actual)",
        value: biasPct,
      },
      {
        ruleId: "backtest.loo_band",
        evidenceSpan: `Leave-one-out symmetric band @ q=${fittedQuantile} abs relative error`,
        value: looBandCoveragePct,
      },
      {
        ruleId: "confidence.ia",
        evidenceSpan: "Anchor ±15% band @ manifestCoverage=1",
        value: anchorBandCoveragePct,
      },
    ],
  };
}
