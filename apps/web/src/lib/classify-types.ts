export type DocType =
  | "vision_card"
  | "heatmap"
  | "hld"
  | "iia_ba_template"
  | "iia_sa_template"
  | "ia_spec"
  | "other";

export type CoverageStatus =
  | "pending"
  | "checking"
  | "partial"
  | "satisfied"
  | "contradictory";

export type ChecklistKey = "requirements" | "impact_areas" | "hld";

export interface ChecklistCoverageItem {
  status: Exclude<CoverageStatus, "pending" | "checking">;
  missing_fields: string[];
  evidence_span: string;
  reason?: string;
}

export interface ClassifyResult {
  doc_type: DocType;
  checklist_coverage: Record<ChecklistKey, ChecklistCoverageItem>;
  confidence: number;
}

export type ClassifyStreamEvent =
  | { type: "checking"; fileId: string }
  | { type: "classified"; fileId: string; result: ClassifyResult }
  | { type: "error"; fileId: string; message: string };

export interface UploadedClassifiedFile {
  id: string;
  file: File;
  result?: ClassifyResult;
  classifying: boolean;
  error?: string;
}

export type ConfidenceFlow = "vision-only" | "iia" | "ia";
