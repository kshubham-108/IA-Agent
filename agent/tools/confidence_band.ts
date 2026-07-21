import { defineTool } from "eve/tools";
import { z } from "zod";
import { confidenceBand } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine confidenceBand.",
  inputSchema: z.object({
    pointEstimate: z.number().describe("GBP point estimate to band"),
    flow: z.enum(["iia", "ia", "vision-only"]),
    manifestCoverage: z.number().min(0).max(1),
  }),
  async execute(input) {
    return confidenceBand(input);
  },
});
