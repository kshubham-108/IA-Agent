import { roundPu } from "./math.js";
import { loadRule, type BaAllocationYaml } from "./rules/loader.js";
import type { BaScoreInput, BaScoreResult } from "./types.js";

function findBand(score: number, rules: BaAllocationYaml) {
  const band = rules.bands.find(
    (b) => score >= b.min_score && score <= b.max_score,
  );
  if (!band) {
    throw new Error(`No BA band for score ${score}`);
  }
  return band;
}

export function scoreBa(input: BaScoreInput): BaScoreResult {
  const year = input.year ?? 2026;
  const rules = loadRule<BaAllocationYaml>("ba-allocation.yaml");

  const popitAndCif =
    input.customer +
    input.peopleProcess +
    input.technology +
    input.complexity +
    input.cif;
  const rawScore = popitAndCif + input.cdf;
  const totalScore = Math.max(0, rawScore);
  const band = findBand(totalScore, rules);

  const yearFactor = rules.year_pu_factors[year] ?? 1;
  const pu = roundPu(band.pu_2026 * yearFactor);

  const durationLabel =
    totalScore === 0
      ? (rules.duration_display.zero ?? "0 wks")
      : band.id === "vh"
        ? (rules.duration_display.vh ?? `${band.duration_weeks_2026} wks`)
        : `${band.duration_weeks_2026} wks`;

  return {
    totalScore,
    popitAndCif,
    rawScore,
    band: band.label,
    bandId: band.id,
    pu,
    effortPct: band.effort_pct,
    durationWeeks: band.duration_weeks_2026,
    durationLabel,
    year,
    provenance: [
      {
        ruleId: "ba.score.popit_cif",
        evidenceSpan: `cust=${input.customer}+pp=${input.peopleProcess}+tech=${input.technology}+comp=${input.complexity}+cif=${input.cif}`,
        value: popitAndCif,
        unit: "score",
      },
      {
        ruleId: "ba.score.cdf",
        evidenceSpan: `cdf=${input.cdf}`,
        value: input.cdf,
        unit: "score",
      },
      {
        ruleId: "ba.score.floor",
        evidenceSpan: rawScore < 0 ? `clamp(${rawScore}, 0)` : "no clamp",
        value: totalScore,
        unit: "score",
      },
      {
        ruleId: `ba.band.${band.id}`,
        evidenceSpan: `${band.min_score}-${band.max_score} → ${band.label}`,
        value: totalScore,
        unit: "score",
      },
      {
        ruleId: "ba.pu.year",
        evidenceSpan: `pu_2026=${band.pu_2026} × factor_${year}=${yearFactor}`,
        value: pu,
        unit: "pu",
      },
    ],
  };
}
