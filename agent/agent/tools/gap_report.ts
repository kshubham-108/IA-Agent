import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine gapReport.",
  inputSchema: z.object({
    manifestId: z.string(),
    extractedFieldIds: z.array(z.string()),
  }),
  async execute(_input) {
    throw new Error("gap_report not implemented — awaiting packages/engine (Agent 1)");
  },
});
