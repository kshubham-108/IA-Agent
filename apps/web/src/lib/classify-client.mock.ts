import type {
  ChecklistCoverageItem,
  ChecklistKey,
  ClassifyResult,
  DocType,
} from "./classify-types";

function coverageItem(
  status: ChecklistCoverageItem["status"],
  opts: {
    missing_fields?: string[];
    evidence_span?: string;
    reason?: string;
  } = {},
): ChecklistCoverageItem {
  const item: ChecklistCoverageItem = {
    status,
    missing_fields: opts.missing_fields ?? [],
    evidence_span: opts.evidence_span ?? "",
  };
  if (opts.reason) item.reason = opts.reason;
  return item;
}

function none(): ChecklistCoverageItem {
  return coverageItem("partial");
}

function classifyByFilename(name: string): ClassifyResult {
  const lower = name.toLowerCase();

  if (lower.includes("contradict")) {
    return {
      doc_type: "vision_card",
      confidence: 0.4,
      checklist_coverage: {
        requirements: coverageItem("contradictory", {
          reason: "Vision scope conflicts with uploaded heatmap",
          evidence_span: "§Context vs heatmap journey count",
          missing_fields: ["context.scope_alignment"],
        }),
        impact_areas: none(),
        hld: none(),
      },
    };
  }

  if (lower.includes("partial") && lower.includes("heatmap")) {
    return {
      doc_type: "heatmap",
      confidence: 0.55,
      checklist_coverage: {
        requirements: none(),
        impact_areas: coverageItem("partial", {
          reason: "app T-shirt sizes missing",
          missing_fields: ["apps.tshirt_sizes"],
          evidence_span: "Heatmap §Applications — sizes blank",
        }),
        hld: none(),
      },
    };
  }

  if (lower.includes("heatmap")) {
    return {
      doc_type: "heatmap",
      confidence: 0.82,
      checklist_coverage: {
        requirements: none(),
        impact_areas: coverageItem("satisfied", {
          evidence_span: "Solution Heatmap — journeys and apps sized",
        }),
        hld: none(),
      },
    };
  }

  if (lower.includes("hld")) {
    return {
      doc_type: "hld",
      confidence: 0.88,
      checklist_coverage: {
        requirements: none(),
        impact_areas: none(),
        hld: coverageItem("satisfied", {
          evidence_span: "HLD §Architecture — integration patterns documented",
        }),
      },
    };
  }

  if (lower.includes("partial") || lower.includes("thin") || lower.includes("lean")) {
    return {
      doc_type: "vision_card",
      confidence: 0.48,
      checklist_coverage: {
        requirements: coverageItem("partial", {
          reason: "SMART outcomes and value case incomplete",
          missing_fields: ["outcome.smart", "value_case.benefits"],
          evidence_span: "Vision Card §Outcome — SMART grid incomplete",
        }),
        impact_areas: none(),
        hld: none(),
      },
    };
  }

  if (
    lower.includes("vision") ||
    lower.includes("ofr") ||
    lower.includes("offline") ||
    lower.includes("retention") ||
    lower.includes("verint") ||
    lower.includes("pega") ||
    lower.includes("websafe")
  ) {
    return {
      doc_type: "vision_card",
      confidence: 0.9,
      checklist_coverage: {
        requirements: coverageItem("satisfied", {
          evidence_span: "Vision Card — POPIT context and outcomes present",
        }),
        impact_areas: none(),
        hld: none(),
      },
    };
  }

  if (lower.includes("ia") || lower.includes("retain")) {
    return {
      doc_type: "ia_spec",
      confidence: 0.75,
      checklist_coverage: {
        requirements: coverageItem("satisfied", {
          evidence_span: "IA spec — functional requirements enumerated",
        }),
        impact_areas: none(),
        hld: coverageItem("satisfied", {
          evidence_span: "Pack includes HLD attachment",
        }),
      },
    };
  }

  return {
    doc_type: "other",
    confidence: 0.1,
    checklist_coverage: {
      requirements: none(),
      impact_areas: none(),
      hld: none(),
    },
  };
}

export async function mockClassifyDocument(file: File): Promise<ClassifyResult> {
  await delay(350);
  return classifyByFilename(file.name);
}

export async function* mockClassifyStream(
  fileId: string,
  file: File,
): AsyncGenerator<{ type: "checking" } | { type: "classified"; result: ClassifyResult }> {
  yield { type: "checking" };
  await delay(200);
  const result = classifyByFilename(file.name);
  yield { type: "classified", result };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function docTypeIcon(docType: DocType): string {
  const icons: Record<DocType, string> = {
    vision_card: "VC",
    heatmap: "HM",
    hld: "HLD",
    iia_ba_template: "BA",
    iia_sa_template: "SA",
    ia_spec: "IA",
    other: "DOC",
  };
  return icons[docType] ?? "DOC";
}

export function docTypeLabel(docType: DocType): string {
  const labels: Record<DocType, string> = {
    vision_card: "Vision Card",
    heatmap: "Heatmap",
    hld: "HLD",
    iia_ba_template: "IIA BA Template",
    iia_sa_template: "IIA SA Template",
    ia_spec: "IA Spec",
    other: "Document",
  };
  return labels[docType] ?? "Document";
}

export type { ChecklistKey };
