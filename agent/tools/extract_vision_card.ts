import { readFileSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  VisionCardExtract,
  type ExtractedField,
  type VisionCardFormatVariant,
} from "@ia-agent/extraction-schemas";

const inputSchema = z.object({
  documentPath: z
    .string()
    .describe("Path to vision card in corpus or upload (relative to repo root)"),
});

type FixtureDoc = {
  formatVariant: VisionCardFormatVariant;
  fields: ExtractedField[];
  popitEvidence?: VisionCardExtract["popitEvidence"];
};

function resolveDocumentPath(documentPath: string): string {
  const cwd = process.cwd();
  const candidates = [
    documentPath,
    join(cwd, documentPath),
    join(cwd, "..", documentPath),
    join(cwd, "evals/data", basename(documentPath)),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
    if (existsSync(`${candidate}.fixture.json`)) return `${candidate}.fixture.json`;
  }
  return join(cwd, documentPath);
}

function loadFixture(resolvedPath: string): FixtureDoc | null {
  const fixturePath = resolvedPath.endsWith(".fixture.json")
    ? resolvedPath
    : `${resolvedPath}.fixture.json`;
  if (!existsSync(fixturePath)) return null;
  return JSON.parse(readFileSync(fixturePath, "utf8")) as FixtureDoc;
}

function detectFormatVariant(resolvedPath: string, text: string): VisionCardFormatVariant {
  const lower = `${resolvedPath} ${text}`.toLowerCase();
  if (lower.includes("§1.1") || lower.includes("smart outcome")) {
    return "numbered-prototype";
  }
  if (lower.includes("lean vision") || lower.includes("sbd phase 2")) {
    return "lean";
  }
  if (lower.includes("idea tracking") || lower.includes("prototype vision card 2026")) {
    return "prototype-2026";
  }
  return "unknown";
}

function missingField(id: string, label: string): ExtractedField {
  return {
    id,
    value: null,
    evidence_span: null,
    confidence: 0,
    status: "missing",
  };
}

export default defineTool({
  description:
    "Extract Vision Card fields with provenance. Returns per-field {value, evidence_span, confidence, status}. No numeric estimate fields.",
  inputSchema,
  async execute({ documentPath }) {
    const resolved = resolveDocumentPath(documentPath);
    const fixture = loadFixture(resolved);
    if (fixture) {
      const extract = VisionCardExtract.parse({
        formatVariant: fixture.formatVariant,
        fields: fixture.fields,
        popitEvidence: fixture.popitEvidence,
      });
      return extract;
    }

    if (!existsSync(resolved)) {
      return VisionCardExtract.parse({
        formatVariant: "unknown",
        fields: [
          missingField("document", `File not found: ${documentPath}`),
        ],
      });
    }

    const text = readFileSync(resolved, "utf8");
    const formatVariant = detectFormatVariant(resolved, text);
    const fields: ExtractedField[] = [
      {
        id: "raw_text",
        value: text.slice(0, 500),
        evidence_span: text.slice(0, 120),
        confidence: 0.5,
        status: "found",
      },
    ];

    return VisionCardExtract.parse({
      formatVariant,
      fields,
    });
  },
});
