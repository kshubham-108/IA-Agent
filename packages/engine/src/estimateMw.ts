import { roundPu } from "./math.js";
import { loadRule, type MwYaml } from "./rules/loader.js";
import type { TemplateEstimateResult } from "./types.js";

export interface EstimateMwInput {
  action: "New" | "Modify" | "Reuse" | "Onboard";
  platform: "Apigee" | "MSA" | "Fusion";
  size: "S" | "M" | "C";
}

export function estimateMw(input: EstimateMwInput): TemplateEstimateResult {
  const rules = loadRule<MwYaml>("mw.yaml");
  const rawPu = rules.matrix[input.action]?.[input.platform]?.[input.size];
  if (rawPu === undefined) {
    throw new Error(
      `No MW PU for ${input.action}/${input.platform}/${input.size}`,
    );
  }
  const pu = roundPu(rawPu);

  return {
    totalPu: pu,
    personWeeks: roundPu(pu / 5),
    lineItems: [
      {
        id: "mw-base",
        pu,
        ruleId: "mw.matrix",
        evidenceSpan: `${input.action}/${input.platform}/${input.size}`,
      },
    ],
    provenance: [
      {
        ruleId: "mw.matrix",
        evidenceSpan: `${input.action}/${input.platform}/${input.size}`,
        value: pu,
        unit: "pu",
      },
    ],
  };
}
