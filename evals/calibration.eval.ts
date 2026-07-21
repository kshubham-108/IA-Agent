import { defineEval } from "eve/evals";
import { equals, gte } from "eve/evals/expect";
import { runBacktest } from "./backtest.js";
import { runExtractionEval } from "./extraction-eval.js";
import { buildCalibrationReportMarkdown, writeCalibrationReport } from "./run-calibration.js";

export default [
  defineEval({
    description: "Calibration backtest: MAPE/bias + LOO band coverage ≥90%",
    tags: ["calibration", "backtest", "§3A"],
    async test(t) {
      const result = runBacktest({ bandCoverageTargetPct: 90 });
      t.check(result.rowCount, equals(25));
      t.check(result.excludedIds.length, equals(2));
      t.check(result.mapePct, gte(0));
      t.check(result.looBandCoveragePct, gte(90));
      t.check(result.bandCoverageMet, equals(true));
    },
  }),
  defineEval({
    description: "Extraction eval: §5b labelled pairs + manifest coverage sample",
    tags: ["calibration", "extraction", "§5b"],
    async test(t) {
      const result = runExtractionEval();
      t.check(result.labelled.length, equals(4));
      t.check(result.aggregateFieldAccuracyPct, gte(95));
      t.check(result.popitPassCount, gte(3));
      t.check(result.bandPassCount, equals(4));
      t.check(result.manifestCoverage.sampleSize, equals(10));
      t.check(result.fieldAccuracyMet, equals(true));
      t.check(result.popitMet, equals(true));
      t.check(result.bandMet, equals(true));
    },
  }),
  defineEval({
    description: "Emit calibration_report.md on every calibration run",
    tags: ["calibration", "report"],
    async test(t) {
      const markdown = buildCalibrationReportMarkdown();
      t.check(markdown.includes("# Calibration Report"), equals(true));
      t.check(markdown.includes("Leave-one-out band coverage"), equals(true));
      const output = writeCalibrationReport();
      t.check(output.endsWith("evals/calibration_report.md"), equals(true));
    },
  }),
];
