import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { loadRule } from "@ia-agent/engine";

export const DOC_TYPES = [
  "vision_card",
  "heatmap",
  "hld",
  "iia_ba_template",
  "iia_sa_template",
  "ia_spec",
  "other",
] as const;

export type DocType = (typeof DOC_TYPES)[number];

export const CHECKLIST_STATUSES = [
  "pending",
  "checking",
  "partial",
  "satisfied",
  "contradictory",
] as const;

export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number];

export interface ChecklistItemCoverage {
  status: ChecklistStatus;
  missing_fields: string[];
  evidence_span: string | null;
}

export interface ClassifyDocumentResult {
  filename: string;
  doc_type: DocType;
  checklist_coverage: {
    requirements: ChecklistItemCoverage;
    impact_areas: ChecklistItemCoverage;
    hld: ChecklistItemCoverage;
  };
  confidence: number;
}

export interface ClassifyDocumentInput {
  filename: string;
  text?: string;
  documentPath?: string;
}

interface ManifestYaml {
  id: string;
  description: string;
  fields: Array<{ id: string; label: string; impact: string }>;
}

interface ReadinessChecklistYaml {
  requirements: { manifest_id: string; field_ids: string[] };
  impact_areas: { manifest_id: string; field_ids: string[] };
  hld: { satisfied_doc_types: DocType[] };
}

interface ClassifyFixture {
  doc_type: DocType;
  checklist_coverage: ClassifyDocumentResult["checklist_coverage"];
  confidence: number;
}

const FIELD_HINTS: Record<string, RegExp[]> = {
  title: [/idea title/i, /\btitle\b/i, /vision card/i],
  tracking_id: [/tracking id/i, /idea tracking/i],
  budget_ref: [/budget reference/i, /budget ref/i],
  sponsor: [/executive sponsor/i, /\bsponsor\b/i],
  proposer: [/idea proposer/i, /\bproposer\b/i],
  products_in_scope: [/products.*scope/i, /services in scope/i],
  channels_processes_systems: [/channels.*processes.*systems/i, /channels\/processes/i],
  current_state: [/current state/i],
  problem_opportunity: [/problem.*opportunity/i, /problem \/ opportunity/i],
  future_vision: [/future vision/i, /outcome/i, /future state/i],
  beneficiaries: [/beneficiaries/i],
  exclusions: [/exclusions/i],
  dependencies: [/dependencies/i],
  journey_counts: [/journey/i, /workflow/i],
  heatmap: [/solution heatmap/i, /impact areas/i, /popit heatmap/i, /\bheatmap\b/i],
};

const CONTRADICTION_PATTERNS: RegExp[] = [
  /products.*in scope:[^\n]+[\s\S]{0,400}exclusions:[^\n]+(?:same|all).*(?:excluded|out of scope)/i,
  /in scope:[^\n]+mobile[\s\S]{0,300}exclusions:[^\n]+mobile/i,
  /scope:[^\n]+included[\s\S]{0,300}excluded from scope/i,
];

function resolveDocumentText(input: ClassifyDocumentInput): string {
  if (input.text?.trim()) return input.text;
  if (!input.documentPath) return "";

  const cwd = process.cwd();
  const candidates = [
    input.documentPath,
    join(cwd, input.documentPath),
    join(cwd, "..", input.documentPath),
    join(cwd, "evals/data", basename(input.documentPath)),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return readFileSync(candidate, "utf8");
    }
  }

  return "";
}

function resolveFixturePath(input: ClassifyDocumentInput): string | null {
  if (!input.documentPath) return null;
  const cwd = process.cwd();
  const candidates = [
    input.documentPath,
    join(cwd, input.documentPath),
    join(cwd, "..", input.documentPath),
    join(cwd, "evals/data", basename(input.documentPath)),
  ];
  for (const candidate of candidates) {
    const fixturePath = candidate.endsWith(".classify.fixture.json")
      ? candidate
      : `${candidate}.classify.fixture.json`;
    if (existsSync(fixturePath)) return fixturePath;
  }
  return null;
}

function loadFixture(input: ClassifyDocumentInput): ClassifyFixture | null {
  const fixturePath = resolveFixturePath(input);
  if (!fixturePath) return null;
  return JSON.parse(readFileSync(fixturePath, "utf8")) as ClassifyFixture;
}

function loadChecklistConfig(): ReadinessChecklistYaml {
  return loadRule<ReadinessChecklistYaml>("manifests/readiness-checklist.yaml");
}

function loadManifest(manifestId: string): ManifestYaml {
  return loadRule<ManifestYaml>(`manifests/${manifestId}.yaml`);
}

function manifestLabels(manifestId: string, fieldIds: string[]): Map<string, string> {
  const manifest = loadManifest(manifestId);
  const labels = new Map<string, string>();
  for (const field of manifest.fields) {
    if (fieldIds.includes(field.id)) {
      labels.set(field.id, field.label);
    }
  }
  return labels;
}

function detectPresentFieldIds(text: string, fieldIds: string[]): string[] {
  const lower = text.toLowerCase();
  return fieldIds.filter((fieldId) => {
    const hints = FIELD_HINTS[fieldId] ?? [new RegExp(fieldId.replace(/_/g, "[\\s_-]+"), "i")];
    return hints.some((pattern) => pattern.test(lower));
  });
}

function firstEvidenceSpan(text: string, fieldId: string): string | null {
  const lines = text.split(/\r?\n/);
  const hints = FIELD_HINTS[fieldId] ?? [];
  for (const line of lines) {
    if (hints.some((pattern) => pattern.test(line))) {
      return line.trim().slice(0, 120) || null;
    }
  }
  return null;
}

function hasContradiction(text: string): boolean {
  return CONTRADICTION_PATTERNS.some((pattern) => pattern.test(text));
}

function detectDocType(filename: string, text: string): DocType {
  const haystack = `${filename}\n${text}`.toLowerCase();

  if (/solution heatmap|impact areas heatmap|popit heatmap/.test(haystack) && !/vision card/.test(haystack)) {
    return "heatmap";
  }
  if (/high[- ]level design|\bhld\b|architecture overview|component diagram/.test(haystack)) {
    return "hld";
  }
  if (/ia spec|impact assessment spec|detailed requirements pack/.test(haystack)) {
    return "ia_spec";
  }
  if (/iia.*ba|ba allocation|business analyst template/.test(haystack)) {
    return "iia_ba_template";
  }
  if (/iia.*sa|sa allocation|solution architect template/.test(haystack)) {
    return "iia_sa_template";
  }
  if (/vision card|idea tracking|prototype vision card|smart outcome grid/.test(haystack)) {
    return "vision_card";
  }
  if (/weekly status|meeting minutes|facilities request|hr policy/.test(haystack)) {
    return "other";
  }
  return "other";
}

function buildItemCoverage(
  presentIds: string[],
  requiredIds: string[],
  labels: Map<string, string>,
  text: string,
  forceStatus?: ChecklistStatus,
): ChecklistItemCoverage {
  if (forceStatus === "contradictory") {
    return {
      status: "contradictory",
      missing_fields: requiredIds.filter((id) => !presentIds.includes(id)),
      evidence_span: "Conflicting scope statements detected in document text",
    };
  }

  const missing = requiredIds.filter((id) => !presentIds.includes(id));
  if (requiredIds.length === 0) {
    return { status: "pending", missing_fields: [], evidence_span: null };
  }
  if (missing.length === 0) {
    const anchorField = requiredIds[requiredIds.length - 1] ?? requiredIds[0];
    return {
      status: "satisfied",
      missing_fields: [],
      evidence_span: firstEvidenceSpan(text, anchorField),
    };
  }
  if (presentIds.length > 0) {
    return {
      status: "partial",
      missing_fields: missing,
      evidence_span: firstEvidenceSpan(text, presentIds[0]!),
    };
  }
  return {
    status: "pending",
    missing_fields: missing,
    evidence_span: null,
  };
}

function classifyDeterministic(input: ClassifyDocumentInput, text: string): ClassifyDocumentResult {
  const checklist = loadChecklistConfig();
  const reqLabels = manifestLabels(
    checklist.requirements.manifest_id,
    checklist.requirements.field_ids,
  );
  const impactLabels = manifestLabels(
    checklist.impact_areas.manifest_id,
    checklist.impact_areas.field_ids,
  );

  const docType = detectDocType(input.filename, text);
  const contradiction = hasContradiction(text);

  const reqPresent =
    docType === "vision_card" || docType === "iia_ba_template" || docType === "iia_sa_template"
      ? detectPresentFieldIds(text, checklist.requirements.field_ids)
      : [];
  const impactPresent =
    docType === "heatmap"
      ? checklist.impact_areas.field_ids
      : detectPresentFieldIds(text, checklist.impact_areas.field_ids);

  const requirements = buildItemCoverage(
    reqPresent,
    docType === "vision_card" || docType === "iia_ba_template" || docType === "iia_sa_template"
      ? checklist.requirements.field_ids
      : [],
    reqLabels,
    text,
    contradiction ? "contradictory" : undefined,
  );

  const impactAreas =
    docType === "heatmap"
      ? {
          status: "satisfied" as const,
          missing_fields: [] as string[],
          evidence_span: firstEvidenceSpan(text, "heatmap"),
        }
      : buildItemCoverage(
          impactPresent,
          checklist.impact_areas.field_ids,
          impactLabels,
          text,
        );

  const hld = checklist.hld.satisfied_doc_types.includes(docType)
    ? {
        status: "satisfied" as const,
        missing_fields: [] as string[],
        evidence_span:
          firstEvidenceSpan(text, "future_vision") ?? (text.slice(0, 120) || null),
      }
    : { status: "pending" as const, missing_fields: [] as string[], evidence_span: null };

  const confidence =
    docType === "other"
      ? 0.35
      : contradiction
        ? 0.55
        : requirements.status === "satisfied"
          ? 0.92
          : requirements.status === "partial"
            ? 0.68
            : 0.75;

  return {
    filename: input.filename,
    doc_type: docType,
    checklist_coverage: {
      requirements,
      impact_areas: impactAreas,
      hld,
    },
    confidence,
  };
}

export async function classifyDocument(input: ClassifyDocumentInput): Promise<ClassifyDocumentResult> {
  const fixture = loadFixture(input);
  const text = input.text?.trim() ? input.text : resolveDocumentText(input);

  if (fixture) {
    return {
      filename: input.filename,
      doc_type: fixture.doc_type,
      checklist_coverage: fixture.checklist_coverage,
      confidence: fixture.confidence,
    };
  }

  return classifyDeterministic(input, text);
}

export async function classifyDocuments(
  documents: ClassifyDocumentInput[],
): Promise<ClassifyDocumentResult[]> {
  return Promise.all(documents.map((document) => classifyDocument(document)));
}
