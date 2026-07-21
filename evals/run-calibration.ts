import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { runBacktest } from "./backtest.js";
import { runExtractionEval } from "./extraction-eval.js";
import { REPO_ROOT } from "./lib/paths.js";

function status(ok: boolean): string {
  return ok ? "PASS" : "FAIL";
}

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function buildCalibrationReportMarkdown(): string {
  const backtest = runBacktest();
  const extraction = runExtractionEval();
  const generatedAt = new Date().toISOString();

  const labelledRows = extraction.labelled
    .map(
      (row) =>
        `| ${row.id} | ${formatPct(row.fieldAccuracyPct)} | ${row.popitWithinTolerance}/4 | ${status(row.bandCorrect)} | ${status(row.puCorrect)} | ${status(row.gapFieldsFlagged)} |`,
    )
    .join("\n");

  const sampleRows = extraction.manifestCoverage.samples
    .map(
      (sample) =>
        `| ${sample.filename} | ${sample.formatVariant} | ${(sample.coverage * 100).toFixed(1)}% | ${sample.gapCount} |`,
    )
    .join("\n");

  const backtestRows = backtest.rows
    .slice(0, 10)
    .map(
      (row) =>
        `| ${row.id} | £${row.engineCostGbp.toLocaleString("en-GB")} | £${row.actualCostGbp.toLocaleString("en-GB")} | ${(row.relativeError * 100).toFixed(2)}% | ${status(row.looCovered)} |`,
    )
    .join("\n");

  return `# Calibration Report

Generated: ${generatedAt}

## Backtest (Wall of Reference @ £${backtest.pur})

| Metric | Value | Target | Status |
|---|---:|---|:---:|
| MAPE | ${formatPct(backtest.mapePct)} | — | — |
| Bias | ${formatPct(backtest.biasPct)} | — | — |
| Leave-one-out band coverage | ${formatPct(backtest.looBandCoveragePct)} | ≥${backtest.bandCoverageTargetPct}% | ${status(backtest.bandCoverageMet)} |
| Anchor IA band coverage (±15%) | ${formatPct(backtest.anchorBandCoveragePct)} | — | — |
| Fitted LOO half-width | ±${(backtest.fittedHalfWidthPct * 100).toFixed(2)}% (q=${backtest.fittedQuantile}) | — | — |

Excluded from calibration (${backtest.excludedIds.length} explained outliers): ${backtest.excludedIds.join(", ")}.

Evaluated rows: ${backtest.rowCount} (engine \`applyPur\` @ 2025 PUR).

### Sample row results (first 10)

| Project id | Engine £ | Actual £ | Relative error | LOO covered |
|---|---:|---:|---:|:---:|
${backtestRows}

## Extraction eval (§5b labelled pairs)

| Metric | Value | Target | Status |
|---|---:|---|:---:|
| Aggregate field accuracy | ${formatPct(extraction.aggregateFieldAccuracyPct)} | ≥${extraction.fieldAccuracyTargetPct}% | ${status(extraction.fieldAccuracyMet)} |
| POPIT tolerance | ${extraction.popitPassCount}/4 pairs | ${extraction.popitTarget} | ${status(extraction.popitMet)} |
| Band correctness | ${extraction.bandPassCount}/4 | ${extraction.bandTarget} | ${status(extraction.bandMet)} |

| Pair | Field accuracy | POPIT ±1 dims | Band | PU | Gap flags |
|---|---:|---:|:---:|:---:|:---:|
${labelledRows}

## Manifest coverage distribution (unlabelled sample)

Seed: ${extraction.manifestCoverage.seed}; sample size: ${extraction.manifestCoverage.sampleSize}.

| Stat | Value |
|---|---:|
| Mean coverage | ${(extraction.manifestCoverage.meanCoverage * 100).toFixed(1)}% |
| Min | ${(extraction.manifestCoverage.minCoverage * 100).toFixed(1)}% |
| Max | ${(extraction.manifestCoverage.maxCoverage * 100).toFixed(1)}% |

Buckets: ${Object.entries(extraction.manifestCoverage.buckets)
    .map(([bucket, count]) => `${bucket}=${count}`)
    .join(", ")}

Confidence slider seed (mean manifest coverage): **${extraction.manifestCoverage.meanCoverage.toFixed(3)}**

| Vision card | Format | Coverage | Gaps |
|---|---|---:|---:|
${sampleRows}

## Provenance

${[...backtest.provenance, ...extraction.provenance]
  .map((item) => `- \`${item.ruleId}\`: ${item.evidenceSpan}${item.value !== undefined ? ` → ${item.value}` : ""}`)
  .join("\n")}
`;
}

export function writeManifestSample(
  outputPath = join(REPO_ROOT, "evals/data/manifest-sample.json"),
): void {
  const result = runExtractionEval();
  writeFileSync(
    outputPath,
    `${JSON.stringify(
      {
        seed: result.manifestCoverage.seed,
        sampleSize: result.manifestCoverage.sampleSize,
        meanCoverage: result.manifestCoverage.meanCoverage,
        description:
          "Unlabelled vision cards sampled for manifest coverage distribution (confidence slider seed)",
        filenames: result.manifestCoverage.samples.map((sample) => sample.filename),
        samples: result.manifestCoverage.samples,
      },
      null,
      2,
    )}\n`,
  );
}

export function writeCalibrationReport(outputPath = join(REPO_ROOT, "evals/calibration_report.md")): string {
  writeManifestSample();
  const markdown = buildCalibrationReportMarkdown();
  writeFileSync(outputPath, markdown, "utf8");
  return outputPath;
}

if (import.meta.main) {
  const output = writeCalibrationReport();
  console.log(`Wrote ${output}`);
}
