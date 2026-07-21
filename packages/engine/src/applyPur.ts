import { roundMoney } from "./math.js";
import { loadRule, type RatesYaml } from "./rules/loader.js";
import type { ApplyPurResult, Year } from "./types.js";

export interface ApplyPurInput {
  pu: number;
  year?: Year;
  pur?: number;
}

export function getPur(year: number): number {
  const rates = loadRule<RatesYaml>("rates.yaml");
  const pur = rates.tcs_consumer_data[year];
  if (pur === undefined) {
    throw new Error(`No PUR configured for year ${year}`);
  }
  return pur;
}

export function applyPur(input: ApplyPurInput): ApplyPurResult {
  const year = input.year ?? 2026;
  const pur = input.pur ?? getPur(year);
  const costGbp = roundMoney(input.pu * pur);

  return {
    pu: input.pu,
    pur,
    costGbp,
    year,
    provenance: [
      {
        ruleId: "rates.tcs_consumer_data",
        evidenceSpan: `${input.pu} PU × £${pur} (${year})`,
        value: costGbp,
        unit: "gbp",
      },
    ],
  };
}
