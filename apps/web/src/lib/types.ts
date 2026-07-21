export type FlowType = "iia" | "ia";

export interface Provenance {
  ruleId: string;
  evidenceSpan: string;
}

export interface LineItem {
  id: string;
  label: string;
  pu: number;
  costGbp: number;
  provenance: Provenance;
  children?: LineItem[];
}

export type GapImpact = "high" | "medium" | "low";

export interface GapField {
  id: string;
  label: string;
  impact: GapImpact;
  description: string;
  answer?: string;
}

export interface ConfidenceBand {
  lowPu: number;
  highPu: number;
  lowGbp: number;
  highGbp: number;
  coverage: number;
}

export interface EstimateHeadline {
  pu: number;
  costGbp: number;
  duration: string;
  band: string;
}

export interface EstimateResult {
  sessionId: string;
  flow: FlowType;
  year: number;
  pur: number;
  projectName: string;
  headline: EstimateHeadline;
  confidence: ConfidenceBand;
  lineItems: LineItem[];
  gaps: GapField[];
  agentMode?: "mock" | "live";
}

export interface UploadedFileMeta {
  name: string;
  type: string;
  size: number;
}

export interface EstimateRequest {
  flow: FlowType;
  year: number;
  file: UploadedFileMeta;
  fileContentBase64?: string;
  gapAnswers?: Record<string, string>;
  sessionId?: string;
}

export interface RatesMap {
  tcs_consumer_data: Record<number, number>;
  defaultYear: number;
}
