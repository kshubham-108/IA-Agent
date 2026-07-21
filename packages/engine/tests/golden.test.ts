import { describe, expect, it } from "vitest";
import {
  applyPur,
  confidenceBand,
  estimate360,
  estimateComplexity,
  estimateData,
  estimateDfe,
  estimateMw,
  loadRule,
  lookupDataEtlPu,
  scoreBa,
  scoreSa,
  seedFunding,
  splitDataMilestones,
  type WallOfReferenceYaml,
} from "../src/index.js";

describe("§3A — Wall of Reference costs @ £425.52", () => {
  const wall = loadRule<WallOfReferenceYaml>("wall-of-reference.yaml");

  it("has 27 calibrated rows", () => {
    expect(wall.rows).toHaveLength(27);
  });

  it.each(wall.rows.map((row) => [row.id, row.pu, row.cost_gbp] as const))(
    "%s — PU → £ to 2 d.p.",
    (_id, pu, expectedCost) => {
      const result = applyPur({ pu, year: 2025, pur: wall.pur });
      expect(result.costGbp).toBe(expectedCost);
    },
  );

  it("small-change pack totals 80 PU → £34,041.60", () => {
    const pack = wall.small_change_pack;
    expect(pack.items.reduce((a, b) => a + b, 0)).toBe(pack.total_pu);
    const cost = applyPur({ pu: pack.total_pu, year: 2025, pur: wall.pur });
    expect(cost.costGbp).toBe(pack.total_cost_gbp);
  });

  it("headline consumer projects match brief", () => {
    const byId = Object.fromEntries(wall.rows.map((r) => [r.id, r]));
    expect(byId["consumer-myo2"]?.cost_gbp).toBe(1_284_538.5);
    expect(byId["consumer-retainx"]?.cost_gbp).toBe(1_771_380.19);
    expect(byId["consumer-payg-transformation"]?.cost_gbp).toBe(1_384_216.56);
    expect(byId["consumer-payg-comms"]?.cost_gbp).toBe(781_254.72);
    expect(byId["consumer-bss-comms"]?.cost_gbp).toBe(622_110.24);
    expect(byId["consumer-o2-website"]?.cost_gbp).toBe(6_890_232.6);
    expect(byId["consumer-o2-marketing"]?.cost_gbp).toBe(5_073_900.48);
  });

  it("data-lot regression outliers retained", () => {
    const byId = Object.fromEntries(wall.rows.map((r) => [r.id, r]));
    expect(byId["data-ace-landing-pad"]?.pu).toBeCloseTo(4693.3, 1);
    expect(byId["data-edh-gcp"]?.pu).toBeCloseTo(9792.84, 1);
    expect(byId["data-netpulse-gcp"]?.pu).toBe(9504);
    expect(byId["data-ncc-phase-4"]?.pu).toBeCloseTo(556.42, 1);
    expect(byId["data-helix-datalake"]?.pu).toBeCloseTo(492.06, 1);
  });
});

describe("§3B — template arithmetic", () => {
  it("RetainX → 4,162.86 PU (832.572 pw)", () => {
    const result = estimateDfe({ templateId: "retainx" });
    expect(result.totalPu).toBe(4162.86);
    expect(result.personWeeks).toBe(832.57);
    expect(result.provenance.length).toBeGreaterThan(0);
  });

  it("O2T → 16,192.5 PU (3,238.5 pw)", () => {
    const result = estimateDfe({ templateId: "o2t" });
    expect(result.totalPu).toBe(16192.5);
    expect(result.personWeeks).toBe(3238.5);
  });

  it("DFE default 28 → 86.94 PU", () => {
    const result = estimateDfe({ templateId: "dfe-default", basePu: 28 });
    expect(result.totalPu).toBe(86.94);
  });

  it("complexity New/Enh tables with reuse pro-rata", () => {
    expect(estimateComplexity("new", "s")).toBe(3);
    expect(estimateComplexity("new", "m")).toBe(5);
    expect(estimateComplexity("new", "c")).toBe(8);
    expect(estimateComplexity("new", "vc")).toBe(12);
    expect(estimateComplexity("enh", "s")).toBe(0.75);
    expect(estimateComplexity("enh", "m")).toBe(2.5);
    expect(estimateComplexity("enh", "c")).toBe(6);
    expect(estimateComplexity("enh", "vc")).toBe(12);
    expect(estimateComplexity("enh", "m", 50)).toBe(1.25);
  });

  it("data ETL matrix High/RealTime/VC = 56", () => {
    expect(
      lookupDataEtlPu({
        volume: "High",
        latency: "RealTime",
        classification: "VC",
      }),
    ).toBe(56);
    expect(
      lookupDataEtlPu({
        volume: "Low",
        latency: "Batch",
        classification: "VS",
      }),
    ).toBe(2);
  });

  it("data ETL accelerators and storage multipliers", () => {
    const withCif = lookupDataEtlPu({
      volume: "High",
      latency: "RealTime",
      classification: "VC",
      accelerators: ["CIF"],
    });
    expect(withCif).toBe(40.88);
  });

  it("MW matrix lookup", () => {
    expect(estimateMw({ action: "New", platform: "Apigee", size: "M" }).totalPu).toBe(15);
  });

  it("360 AD T-shirt sizes", () => {
    expect(estimate360({ size: "XS" }).totalPu).toBe(13);
    expect(estimate360({ size: "S" }).totalPu).toBe(25);
    expect(estimate360({ size: "M" }).totalPu).toBe(49);
    expect(estimate360({ size: "L" }).totalPu).toBe(97);
    expect(estimate360({ size: "XL" }).totalPu).toBe(218);
  });

  it("data milestone splits", () => {
    const splits = splitDataMilestones(100);
    expect(splits.design).toBe(40);
    expect(splits.build_and_ut).toBe(60);
    expect(splits.st_support).toBe(10);
    expect(splits.oat_and_deploy).toBe(5);
    expect(splits.warranty_opex).toBe(8);
    expect(splits.additional_ps).toBe(1);
  });

  it("estimateData returns provenance", () => {
    const result = estimateData({
      volume: "High",
      latency: "RealTime",
      classification: "VC",
      includeMilestones: true,
    });
    expect(result.totalPu).toBe(56);
    expect(result.provenance.length).toBeGreaterThan(1);
  });
});

describe("§3C — OFR seed funding", () => {
  it("BA 295.2 + SA 161 = 456.2 PU", () => {
    const result = seedFunding({ year: 2026 });
    expect(result.baPu).toBe(295.2);
    expect(result.saPu).toBe(161);
    expect(result.totalPu).toBe(456.2);
  });

  it("£165,144.40 @2026", () => {
    expect(seedFunding({ year: 2026 }).costGbp).toBe(165_144.4);
  });

  it("year toggles @2025 / @2027", () => {
    expect(seedFunding({ year: 2025 }).costGbp).toBe(194_122.22);
    expect(seedFunding({ year: 2027 }).costGbp).toBe(109_031.8);
    expect(seedFunding({ year: 2025 }).totalPu).toBe(456.2);
    expect(seedFunding({ year: 2027 }).totalPu).toBe(456.2);
  });

  it("duration = max(BA, SA) elapsed weeks", () => {
    const result = seedFunding({ year: 2026 });
    expect(result.durationWeeks).toBe(19.68);
    expect(result.durationLabel).toBe("20+ wks");
  });
});

describe("§3D — five BA calculator golden cases", () => {
  const cases = [
    {
      name: "Verint to AWS Migration",
      input: { customer: 1, peopleProcess: 1, technology: 3, complexity: 1, cif: 1, cdf: -2 },
      total: 5,
      band: "Medium",
      pu2026: 49.2,
      durationLabel: "10 wks",
      effortPct: 1.0,
    },
    {
      name: "Offline Fixed Retentions",
      input: { customer: 4, peopleProcess: 5, technology: 4, complexity: 3, cif: 4, cdf: 0 },
      total: 20,
      band: "Very High",
      pu2026: 295.2,
      durationLabel: "20+ wks",
      effortPct: 3.0,
    },
    {
      name: "PEGA Migration",
      input: { customer: 0, peopleProcess: 2, technology: 1, complexity: 2, cif: 1, cdf: -4 },
      total: 2,
      band: "Low",
      pu2026: 16.4,
      durationLabel: "6.5 wks",
      effortPct: 0.5,
    },
    {
      name: "Woody RAF Migration",
      input: { customer: 0, peopleProcess: 2, technology: 3, complexity: 1, cif: 1, cdf: -7 },
      popitAndCif: 7,
      total: 0,
      band: "Very Low",
      pu2026: 0,
      durationLabel: "0 wks",
      effortPct: 0,
    },
    {
      name: "Websafe Strategic",
      input: { customer: 2, peopleProcess: 2, technology: 5, complexity: 3, cif: 2, cdf: -2 },
      total: 12,
      band: "Medium High",
      pu2026: 65.6,
      durationLabel: "13 wks",
      effortPct: 1.0,
    },
  ] as const;

  it.each(cases)("$name — score, band, PU @2026", (testCase) => {
    const result = scoreBa({ ...testCase.input, year: 2026 });
    expect(result.totalScore).toBe(testCase.total);
    if ("popitAndCif" in testCase) {
      expect(result.popitAndCif).toBe(testCase.popitAndCif);
      expect(result.rawScore).toBe(testCase.popitAndCif + testCase.input.cdf);
    }
    expect(result.band).toBe(testCase.band);
    expect(result.pu).toBe(testCase.pu2026);
    expect(result.durationLabel).toBe(testCase.durationLabel);
    expect(result.effortPct).toBe(testCase.effortPct);
  });

  it("band lookup boundaries", () => {
    expect(scoreBa({ customer: 0, peopleProcess: 0, technology: 0, complexity: 1, cif: 0, cdf: 0 }).bandId).toBe("vl");
    expect(scoreBa({ customer: 1, peopleProcess: 1, technology: 0, complexity: 0, cif: 0, cdf: 0 }).bandId).toBe("l");
    expect(scoreBa({ customer: 2, peopleProcess: 1, technology: 1, complexity: 1, cif: 0, cdf: 0 }).bandId).toBe("m");
    expect(scoreBa({ customer: 3, peopleProcess: 2, technology: 2, complexity: 2, cif: 1, cdf: 0 }).bandId).toBe("mh");
    expect(scoreBa({ customer: 4, peopleProcess: 4, technology: 4, complexity: 4, cif: 0, cdf: 0 }).bandId).toBe("h");
    expect(scoreBa({ customer: 5, peopleProcess: 5, technology: 5, complexity: 5, cif: 0, cdf: 0 }).bandId).toBe("vh");
  });

  it("PU per year column for VH band", () => {
    const input = cases[1]!.input;
    expect(scoreBa({ ...input, year: 2025 }).pu).toBe(277.2);
    expect(scoreBa({ ...input, year: 2026 }).pu).toBe(295.2);
    expect(scoreBa({ ...input, year: 2027 }).pu).toBe(259.2);
  });

  it("SA score 139 → 161 PU for seed funding", () => {
    expect(scoreSa({ score: 139 }).pu).toBe(161);
    expect(scoreSa({ score: 139 }).durationWeeks).toBe(16.1);
  });
});

describe("confidence band anchors", () => {
  it("IA ±15% at full manifest coverage", () => {
    const band = confidenceBand({
      pointEstimate: 100_000,
      flow: "ia",
      manifestCoverage: 1,
    });
    expect(band.lower).toBe(85_000);
    expect(band.upper).toBe(115_000);
  });

  it("IIA −30%/+50% at full manifest coverage", () => {
    const band = confidenceBand({
      pointEstimate: 100_000,
      flow: "iia",
      manifestCoverage: 1,
    });
    expect(band.lower).toBe(70_000);
    expect(band.upper).toBe(150_000);
  });
});
