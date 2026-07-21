import type { EvalReporter } from "eve/evals/reporters";
import { writeCalibrationReport } from "../run-calibration.js";

export function CalibrationReport(): EvalReporter {
  return {
    async onRunComplete() {
      writeCalibrationReport();
    },
  };
}
