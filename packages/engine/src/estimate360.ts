import { roundPu } from "./math.js";
import { loadRule, type Ad360Yaml } from "./rules/loader.js";
import type { TemplateEstimateResult } from "./types.js";

export type Ad360Size = "XS" | "S" | "M" | "L" | "XL";

export interface Estimate360Input {
  size: Ad360Size;
}

export function estimate360(input: Estimate360Input): TemplateEstimateResult {
  const rules = loadRule<Ad360Yaml>("ad360.yaml");
  const rawPu = rules.sizes[input.size];
  if (rawPu === undefined) {
    throw new Error(`Unknown 360 AD size: ${input.size}`);
  }
  const pu = roundPu(rawPu);

  return {
    totalPu: pu,
    personWeeks: roundPu(pu / 5),
    lineItems: [
      {
        id: "ad360-base",
        pu,
        ruleId: "ad360.tshirt",
        evidenceSpan: `size=${input.size}`,
      },
    ],
    provenance: [
      {
        ruleId: "ad360.tshirt",
        evidenceSpan: `size=${input.size}`,
        value: pu,
        unit: "pu",
      },
    ],
  };
}
