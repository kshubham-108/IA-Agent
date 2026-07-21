export interface ProvenanceStep {
  ruleId: string;
  evidenceSpan: string;
  value: number;
  unit?: "pu" | "gbp" | "weeks" | "pct" | "score";
}

export interface BaScoreInput {
  customer: number;
  peopleProcess: number;
  technology: number;
  complexity: number;
  cif: number;
  cdf: number;
  year?: number;
}

export interface BaScoreResult {
  totalScore: number;
  popitAndCif: number;
  rawScore: number;
  band: string;
  bandId: string;
  pu: number;
  effortPct: number;
  durationWeeks: number;
  durationLabel: string;
  year: number;
  provenance: ProvenanceStep[];
}

export interface SaScoreInput {
  score: number;
  year?: number;
}

export interface SaScoreResult {
  score: number;
  band: string;
  bandId: string;
  resources: number;
  durationWeeks: number;
  pu: number;
  provenance: ProvenanceStep[];
}

export interface TemplateEstimateResult {
  totalPu: number;
  personWeeks: number;
  lineItems: Array<{ id: string; pu: number; ruleId: string; evidenceSpan: string }>;
  provenance: ProvenanceStep[];
}

export interface SeedFundingResult {
  baPu: number;
  saPu: number;
  totalPu: number;
  costGbp: number;
  durationWeeks: number;
  durationLabel: string;
  year: number;
  provenance: ProvenanceStep[];
}

export interface ApplyPurResult {
  pu: number;
  pur: number;
  costGbp: number;
  year: number;
  provenance: ProvenanceStep[];
}

export type ConfidenceFlow = "ia" | "iia" | "vision-only";

export interface ConfidenceBandResult {
  pointEstimate: number;
  lower: number;
  upper: number;
  lowerPct: number;
  upperPct: number;
  flow: ConfidenceFlow;
  manifestCoverage: number;
  provenance: ProvenanceStep[];
}

export type Year = 2025 | 2026 | 2027 | 2028 | 2029 | 2030 | 2031;
