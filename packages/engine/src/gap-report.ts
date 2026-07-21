import { loadRule } from "./rules/loader.js";

export interface ManifestField {
  id: string;
  label: string;
  impact: "low" | "medium" | "high";
}

export interface ManifestYaml {
  id: string;
  description: string;
  fields: ManifestField[];
}

export interface GapReportInput {
  manifestId: string;
  extractedFieldIds: string[];
}

export interface GapItem {
  fieldId: string;
  label: string;
  impact: ManifestField["impact"];
  status: "missing";
}

export interface GapReportResult {
  manifestId: string;
  coverage: number;
  gaps: GapItem[];
  rankedByImpact: GapItem[];
  provenance: Array<{ ruleId: string; evidenceSpan: string }>;
}

const impactRank: Record<ManifestField["impact"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function gapReport(input: GapReportInput): GapReportResult {
  const manifest = loadRule<ManifestYaml>(`manifests/${input.manifestId}.yaml`);
  const present = new Set(input.extractedFieldIds);
  const gaps: GapItem[] = manifest.fields
    .filter((field) => !present.has(field.id))
    .map((field) => ({
      fieldId: field.id,
      label: field.label,
      impact: field.impact,
      status: "missing" as const,
    }));

  const rankedByImpact = [...gaps].sort(
    (a, b) => impactRank[a.impact] - impactRank[b.impact],
  );
  const coverage =
    manifest.fields.length === 0
      ? 1
      : (manifest.fields.length - gaps.length) / manifest.fields.length;

  return {
    manifestId: manifest.id,
    coverage,
    gaps,
    rankedByImpact,
    provenance: [
      {
        ruleId: "manifest.coverage",
        evidenceSpan: `manifests/${input.manifestId}.yaml`,
      },
    ],
  };
}
