import { defineTool } from "eve/tools";
import { z } from "zod";
import { FieldStatus } from "@ia-agent/extraction-schemas";

const ExtractedField = z.object({
  value: z.string().nullable(),
  evidence_span: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  status: FieldStatus,
});

export default defineTool({
  description:
    "Extract Vision Card fields with provenance. Returns no numeric estimate fields.",
  inputSchema: z.object({
    documentPath: z.string().describe("Path to vision card in corpus or upload"),
  }),
  async execute(_input) {
    // Agent 2: wire document parser. Scaffold returns empty extract shape.
    return {
      fields: [] as z.infer<typeof ExtractedField>[],
      formatVariant: "unknown" as const,
    };
  },
});
