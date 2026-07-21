import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  classifyDocuments,
  DOC_TYPES,
  CHECKLIST_STATUSES,
} from "../lib/classify-documents.js";
import { resolveClassifyModel } from "../lib/model-slots.js";

const checklistItemSchema = z.object({
  status: z.enum(CHECKLIST_STATUSES),
  missing_fields: z.array(z.string()),
  evidence_span: z.string().nullable(),
});

const documentInputSchema = z.object({
  filename: z.string().describe("Original upload filename"),
  text: z
    .string()
    .optional()
    .describe("Plain text extracted from the upload (preferred for Stage 1)"),
  documentPath: z
    .string()
    .optional()
    .describe("Optional corpus or eval fixture path when text is not inlined"),
});

const outputSchema = z.object({
  results: z.array(
    z.object({
      filename: z.string(),
      doc_type: z.enum(DOC_TYPES),
      checklist_coverage: z.object({
        requirements: checklistItemSchema,
        impact_areas: checklistItemSchema,
        hld: checklistItemSchema,
      }),
      confidence: z.number(),
    }),
  ),
});

export default defineTool({
  description:
    `Stage 1 readiness classifier (MODEL_CLASSIFY=${resolveClassifyModel()}). Maps each upload to doc_type and checklist coverage using manifest definitions from packages/rules. No estimation or numeric outputs.`,
  inputSchema: z.object({
    documents: z.array(documentInputSchema).min(1),
  }),
  outputSchema,
  async execute({ documents }) {
    const results = await classifyDocuments(documents);
    return { results };
  },
});
