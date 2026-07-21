import { defineTool } from "eve/tools";
import { z } from "zod";
import { estimateData } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine estimateData.",
  inputSchema: z.object({
    volume: z.enum(["High", "Medium", "Low"]),
    latency: z.enum(["RealTime", "Batch"]),
    classification: z.enum(["VC", "VN", "VS"]),
    storageTb: z.number().optional(),
    pii: z.boolean().optional(),
    framework: z.boolean().optional(),
    accelerators: z.array(z.string()).optional(),
    includeMilestones: z.boolean().optional(),
  }),
  async execute(input) {
    return estimateData(input);
  },
});
