import { defineTool } from "eve/tools";
import { z } from "zod";
import { gapReport } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine gapReport.",
  inputSchema: z.object({
    manifestId: z.string(),
    extractedFieldIds: z.array(z.string()),
  }),
  async execute(input) {
    return gapReport(input);
  },
});
