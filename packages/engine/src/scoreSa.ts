import { roundPu } from "./math.js";
import { loadRule, type SaAllocationYaml } from "./rules/loader.js";
import type { SaScoreInput, SaScoreResult } from "./types.js";

function findBand(score: number, rules: SaAllocationYaml) {
  const band = rules.bands.find(
    (b) => score >= b.min_score && score <= b.max_score,
  );
  if (!band) {
    throw new Error(`No SA band for score ${score}`);
  }
  return band;
}

export function scoreSa(input: SaScoreInput): SaScoreResult {
  const year = input.year ?? 2026;
  const rules = loadRule<SaAllocationYaml>("sa-allocation.yaml");
  const band = findBand(input.score, rules);
  const pu = roundPu(band.resources * band.duration_weeks * rules.pu_per_week);

  return {
    score: input.score,
    band: band.label,
    bandId: band.id,
    resources: band.resources,
    durationWeeks: band.duration_weeks,
    pu,
    provenance: [
      {
        ruleId: `sa.band.${band.id}`,
        evidenceSpan: `${band.min_score}-${band.max_score} → ${band.label}`,
        value: input.score,
        unit: "score",
      },
      {
        ruleId: "sa.pu.formula",
        evidenceSpan: `${band.resources} × ${band.duration_weeks}wk × ${rules.pu_per_week} PU/wk (year=${year})`,
        value: pu,
        unit: "pu",
      },
    ],
  };
}
