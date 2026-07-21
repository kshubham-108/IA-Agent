import { roundPu } from "./math.js";
import { loadRule, type SeedFundingYaml } from "./rules/loader.js";
import { applyPur } from "./applyPur.js";
import { scoreBa } from "./scoreBa.js";
import { scoreSa } from "./scoreSa.js";
import type { SeedFundingResult, Year } from "./types.js";

export interface SeedFundingInput {
  year?: number;
}

export function seedFunding(input: SeedFundingInput = {}): SeedFundingResult {
  const year = input.year ?? 2026;
  const config = loadRule<SeedFundingYaml>("seed-funding.yaml");

  const ba = scoreBa({
    customer: config.ba.customer,
    peopleProcess: config.ba.people_process,
    technology: config.ba.technology,
    complexity: config.ba.complexity,
    cif: config.ba.cif,
    cdf: config.ba.cdf,
    year: 2026,
  });

  const sa = scoreSa({ score: config.sa.score, year });
  const baPu = config.ba.pu_2026;
  const saPu = config.sa.pu;
  const totalPu = roundPu(baPu + saPu);
  const cost = applyPur({ pu: totalPu, year: year as Year });

  const durationWeeks = Math.max(ba.durationWeeks, sa.durationWeeks);
  const durationLabel =
    ba.durationWeeks >= sa.durationWeeks && ba.bandId === "vh"
      ? ba.durationLabel
      : `${durationWeeks} wks`;

  return {
    baPu,
    saPu,
    totalPu,
    costGbp: cost.costGbp,
    durationWeeks,
    durationLabel,
    year,
    provenance: [
      ...ba.provenance,
      ...sa.provenance,
      {
        ruleId: "seed-funding.total_pu",
        evidenceSpan: `BA ${baPu} + SA ${saPu}`,
        value: totalPu,
        unit: "pu",
      },
      ...cost.provenance,
    ],
  };
}
