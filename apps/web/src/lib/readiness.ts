import type {
  ChecklistKey,
  ClassifyResult,
  ConfidenceFlow,
  CoverageStatus,
  UploadedClassifiedFile,
} from "./classify-types";

import type { FlowType } from "./types";

export interface ChecklistItemDef {
  id: ChecklistKey;
  label: string;
  optional?: boolean;
  mandatory?: boolean;
}

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  {
    id: "requirements",
    label: "Requirements — Vision Document",
    mandatory: true,
  },
  {
    id: "impact_areas",
    label: "Impact Areas — Solution Heatmap",
    optional: true,
  },
  {
    id: "hld",
    label: "High-Level Design (HLD)",
    optional: true,
  },
];

const STATUS_RANK: Record<CoverageStatus, number> = {
  pending: 0,
  checking: 1,
  partial: 2,
  contradictory: 3,
  satisfied: 4,
};

const BAND_LABELS: Record<ConfidenceFlow, string> = {
  "vision-only": "−50% / +100%",
  iia: "−30% / +50%",
  ia: "±15%",
};

function emptyCoverage(): ClassifyResult["checklist_coverage"] {
  return {
    requirements: {
      status: "partial",
      missing_fields: [],
      evidence_span: "",
    },
    impact_areas: {
      status: "partial",
      missing_fields: [],
      evidence_span: "",
    },
    hld: {
      status: "partial",
      missing_fields: [],
      evidence_span: "",
    },
  };
}

export function mergeChecklistState(
  files: UploadedClassifiedFile[],
): Record<ChecklistKey, { status: CoverageStatus; reason?: string }> {
  const merged: Record<ChecklistKey, { status: CoverageStatus; reason?: string }> = {
    requirements: { status: "pending" },
    impact_areas: { status: "pending" },
    hld: { status: "pending" },
  };

  const anyClassifying = files.some((f) => f.classifying);
  if (files.length === 0) {
    return merged;
  }

  for (const key of Object.keys(merged) as ChecklistKey[]) {
    if (anyClassifying) {
      merged[key].status = "checking";
      continue;
    }

    let best: CoverageStatus = "pending";
    let reason: string | undefined;

    for (const uploaded of files) {
      if (!uploaded.result) continue;
      const item = uploaded.result.checklist_coverage[key];
      if (!isApplicableCoverage(item)) continue;
      const status = item.status as CoverageStatus;
      if (STATUS_RANK[status] > STATUS_RANK[best]) {
        best = status;
        reason = item.reason ?? formatPartialReason(key, item);
      } else if (
        STATUS_RANK[status] === STATUS_RANK[best] &&
        status === "partial" &&
        !reason
      ) {
        reason = item.reason ?? formatPartialReason(key, item);
      }
    }

    merged[key].status = best;
    if (reason) merged[key].reason = reason;
  }

  return merged;
}

function formatPartialReason(
  key: ChecklistKey,
  item: ClassifyResult["checklist_coverage"][ChecklistKey],
): string | undefined {
  if (item.status !== "partial" && item.status !== "contradictory") {
    return undefined;
  }
  if (item.reason) return item.reason;
  if (item.missing_fields.length > 0) {
    return `${item.missing_fields.slice(0, 2).join(", ")} missing`;
  }
  const labels: Record<ChecklistKey, string> = {
    requirements: "Requirements",
    impact_areas: "Impact Areas",
    hld: "HLD",
  };
  return `${labels[key]} — partial: key fields missing`;
}

export function deriveConfidenceFlow(
  checklist: Record<ChecklistKey, { status: CoverageStatus }>,
): ConfidenceFlow {
  if (checklist.hld.status === "satisfied") return "ia";
  if (checklist.impact_areas.status === "satisfied") return "iia";
  if (checklist.requirements.status === "satisfied") return "vision-only";
  return "vision-only";
}

export function confidenceBandLabel(flow: ConfidenceFlow): string {
  return BAND_LABELS[flow];
}

export function deriveFlow(
  checklist: Record<ChecklistKey, { status: CoverageStatus }>,
): FlowType {
  if (checklist.hld.status === "satisfied") return "ia";
  return "iia";
}

export function isSubmitEnabled(
  checklist: Record<ChecklistKey, { status: CoverageStatus }>,
): boolean {
  return checklist.requirements.status === "satisfied";
}

export function pickPrimaryFile(files: UploadedClassifiedFile[]): File | null {
  if (files.length === 0) return null;

  const byType = (type: ClassifyResult["doc_type"]) =>
    files.find((f) => f.result?.doc_type === type)?.file;

  return (
    byType("vision_card") ??
    byType("ia_spec") ??
    byType("hld") ??
    files[0]?.file ??
    null
  );
}

export function checklistAnnouncement(
  checklist: Record<ChecklistKey, { status: CoverageStatus; reason?: string }>,
): string {
  const parts = CHECKLIST_ITEMS.map((item) => {
    const state = checklist[item.id];
    const label = item.label.split(" — ")[0];
    if (state.status === "partial" || state.status === "contradictory") {
      return `${label}: ${state.status}${state.reason ? `, ${state.reason}` : ""}`;
    }
    return `${label}: ${state.status}`;
  });
  return parts.join(". ");
}

function isApplicableCoverage(
  item: ClassifyResult["checklist_coverage"][ChecklistKey],
): boolean {
  if (item.status === "satisfied" || item.status === "contradictory") {
    return true;
  }
  return (
    item.missing_fields.length > 0 ||
    Boolean(item.evidence_span) ||
    Boolean(item.reason)
  );
}

export function createEmptyClassifyResult(): ClassifyResult {
  return {
    doc_type: "other",
    checklist_coverage: emptyCoverage(),
    confidence: 0,
  };
}
