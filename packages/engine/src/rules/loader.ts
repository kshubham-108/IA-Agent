import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { parse } from "yaml";

const require = createRequire(import.meta.url);
const rulesDir = dirname(require.resolve("@ia-agent/rules/rates.yaml"));

const cache = new Map<string, unknown>();

export function loadRule<T>(relativePath: string): T {
  const cached = cache.get(relativePath);
  if (cached !== undefined) {
    return cached as T;
  }
  const content = readFileSync(join(rulesDir, relativePath), "utf8");
  const parsed = parse(content) as T;
  cache.set(relativePath, parsed);
  return parsed;
}

export function clearRulesCache(): void {
  cache.clear();
}

export interface RatesYaml {
  tcs_consumer_data: Record<number, number>;
  techm_reference_pur_2025: number;
  historical: Record<string, number>;
}

export interface BaBand {
  id: string;
  label: string;
  min_score: number;
  max_score: number;
  effort_pct: number;
  duration_weeks_2026: number;
  pu_2026: number;
}

export interface BaAllocationYaml {
  bands: BaBand[];
  year_pu_factors: Record<number, number>;
  duration_display: Record<string, string>;
}

export interface SaBand {
  id: string;
  label: string;
  min_score: number;
  max_score: number;
  resources: number;
  duration_weeks: number;
}

export interface SaAllocationYaml {
  bands: SaBand[];
  pu_per_week: number;
}

export interface SeedFundingYaml {
  case_id: string;
  ba: {
    customer: number;
    people_process: number;
    technology: number;
    complexity: number;
    cif: number;
    cdf: number;
    total_score: number;
    pu_2026: number;
  };
  sa: { score: number; pu: number; resources: number; duration_weeks: number };
  total_pu: number;
  expected_cost_gbp: Record<number, number>;
}

export interface WallRow {
  id: string;
  lot: string;
  project: string;
  pu: number;
  cost_gbp: number;
}

export interface WallOfReferenceYaml {
  pur: number;
  rows: WallRow[];
  small_change_pack: { items: number[]; total_pu: number; total_cost_gbp: number };
}

export interface TemplateYaml {
  id: string;
  label: string;
  base_pu: number;
  overlay_vector: number[];
  fixed_add_pu: number;
  management_overlays: Record<string, number>;
  expected_total_pu: number;
  expected_person_weeks?: number;
  itemised?: Record<string, number>;
  base_multiplier?: number;
  overlay_multiplier?: number;
  golden?: { base_pu: number; expected_pu: number };
}

export interface ConfidenceYaml {
  flows: Record<string, { lower_pct: number; upper_pct: number }>;
  coverage_slack_multiplier: number;
}

export interface ComplexityYaml {
  types: { new: Record<string, number>; enh: Record<string, number> };
  reuse_applies_to: string;
}

export interface DataEtlYaml {
  matrix: Record<string, Record<string, Record<string, number>>>;
  accelerators: Record<string, number>;
  storage_tb: Record<number, number>;
  multipliers: { pii: number; framework: number };
}

export interface MwYaml {
  matrix: Record<string, Record<string, Record<string, number>>>;
}

export interface Ad360Yaml {
  sizes: Record<string, number>;
}

export interface DataMilestonesYaml {
  milestones: Record<string, number>;
}
