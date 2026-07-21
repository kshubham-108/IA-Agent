import { loadRule, type ConfidenceYaml } from "./rules/loader.js";
import { roundMoney } from "./math.js";
import type { ConfidenceBandResult, ConfidenceFlow } from "./types.js";

export function confidenceBand(input: {
  pointEstimate: number;
  flow: ConfidenceFlow;
  manifestCoverage: number;
}): ConfidenceBandResult {
  const rules = loadRule<ConfidenceYaml>("confidence.yaml");
  const anchors = rules.flows[input.flow];
  if (!anchors) {
    throw new Error(`Unknown confidence flow: ${input.flow}`);
  }

  const slack = (1 - input.manifestCoverage) * rules.coverage_slack_multiplier;
  const lowerPct = anchors.lower_pct * (1 + slack);
  const upperPct = anchors.upper_pct * (1 + slack);

  const lower = roundMoney(input.pointEstimate * (1 + lowerPct));
  const upper = roundMoney(input.pointEstimate * (1 + upperPct));

  return {
    pointEstimate: input.pointEstimate,
    lower,
    upper,
    lowerPct,
    upperPct,
    flow: input.flow,
    manifestCoverage: input.manifestCoverage,
    provenance: [
      {
        ruleId: `confidence.${input.flow}`,
        evidenceSpan: `[${lowerPct}, +${upperPct}] @ coverage=${input.manifestCoverage}`,
        value: input.pointEstimate,
        unit: "gbp",
      },
    ],
  };
}
