import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine estimateData.",
  inputSchema: z.object({ templateId: z.string() }),
  async execute() {
    throw new Error("estimate_data not implemented — awaiting packages/engine (Agent 1)");
  },
});
