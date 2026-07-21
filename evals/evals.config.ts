import { defineEvalConfig } from "eve/evals";
import { CalibrationReport } from "./reporters/calibration-report.js";

export default defineEvalConfig({
  description:
    "IA Agent calibration suite — §3A backtest, §5b extraction pairs, engine golden, manifest coverage",
  timeoutMs: 120_000,
  maxConcurrency: 2,
  reporters: [CalibrationReport()],
});
