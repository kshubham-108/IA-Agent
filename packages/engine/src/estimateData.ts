import { roundPu } from "./math.js";
import { loadRule, type ComplexityYaml, type DataEtlYaml, type DataMilestonesYaml } from "./rules/loader.js";
import type { ProvenanceStep, TemplateEstimateResult } from "./types.js";

export interface EstimateDataEtlInput {
  volume: "High" | "Medium" | "Low";
  latency: "RealTime" | "Batch";
  classification: "VC" | "VN" | "VS";
  storageTb?: number;
  pii?: boolean;
  framework?: boolean;
  accelerators?: string[];
}

export interface EstimateDataInput extends EstimateDataEtlInput {
  includeMilestones?: boolean;
}

export function lookupDataEtlPu(input: EstimateDataEtlInput): number {
  const rules = loadRule<DataEtlYaml>("data-etl.yaml");
  const volumeRow = rules.matrix[input.volume];
  const latencyRow = volumeRow?.[input.latency];
  const basePu = latencyRow?.[input.classification];
  if (basePu === undefined) {
    throw new Error(
      `No data ETL PU for ${input.volume}/${input.latency}/${input.classification}`,
    );
  }
  let pu = basePu;

  if (input.storageTb !== undefined) {
    const storagePu = rules.storage_tb[input.storageTb as keyof typeof rules.storage_tb];
    if (storagePu !== undefined) {
      pu += storagePu;
    }
  }

  if (input.pii) {
    pu *= rules.multipliers.pii;
  }
  if (input.framework) {
    pu *= rules.multipliers.framework;
  }

  for (const acc of input.accelerators ?? []) {
    const delta = rules.accelerators[acc];
    if (delta !== undefined) {
      pu *= 1 + delta;
    }
  }

  return roundPu(pu);
}

export function splitDataMilestones(basePu: number): Record<string, number> {
  const rules = loadRule<DataMilestonesYaml>("data-milestones.yaml");
  const splits: Record<string, number> = {};
  for (const [key, pct] of Object.entries(rules.milestones)) {
    splits[key] = roundPu(basePu * pct);
  }
  return splits;
}

export function estimateComplexity(
  type: "new" | "enh",
  size: "s" | "m" | "c" | "vc",
  reusePct = 0,
): number {
  const rules = loadRule<ComplexityYaml>("complexity.yaml");
  const basePu = rules.types[type][size];
  if (basePu === undefined) {
    throw new Error(`No complexity PU for ${type}/${size}`);
  }
  let pu = basePu;
  if (type === "enh" && reusePct > 0) {
    pu = roundPu(pu * (1 - reusePct / 100));
  }
  return roundPu(pu);
}

export function estimateData(input: EstimateDataInput): TemplateEstimateResult {
  const pu = lookupDataEtlPu(input);
  const provenance: ProvenanceStep[] = [
    {
      ruleId: "data-etl.matrix",
      evidenceSpan: `${input.volume}/${input.latency}/${input.classification}`,
      value: pu,
      unit: "pu",
    },
  ];

  const lineItems = [
    {
      id: "data-etl-base",
      pu,
      ruleId: "data-etl.matrix",
      evidenceSpan: provenance[0]!.evidenceSpan,
    },
  ];

  if (input.includeMilestones) {
    const splits = splitDataMilestones(pu);
    for (const [key, splitPu] of Object.entries(splits)) {
      provenance.push({
        ruleId: `data-milestones.${key}`,
        evidenceSpan: `${key}=${splitPu}`,
        value: splitPu,
        unit: "pu",
      });
      lineItems.push({
        id: `milestone-${key}`,
        pu: splitPu,
        ruleId: `data-milestones.${key}`,
        evidenceSpan: `${key} split`,
      });
    }
  }

  return {
    totalPu: pu,
    personWeeks: roundPu(pu / 5),
    lineItems,
    provenance,
  };
}
