import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine confidenceBand.",
  inputSchema: z.object({
    flow: z.enum(["iia", "ia", "vision-only"]),
    manifestCoverage: z.number().min(0).max(1),
  }),
  async execute() {
    throw new Error("confidence_band not implemented — awaiting packages/engine (Agent 1)");
  },
});
