import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine estimateMw.",
  inputSchema: z.object({ templateId: z.string() }),
  async execute() {
    throw new Error("estimate_mw not implemented — awaiting packages/engine (Agent 1)");
  },
});
