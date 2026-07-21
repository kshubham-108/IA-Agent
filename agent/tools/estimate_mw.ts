import { defineTool } from "eve/tools";
import { z } from "zod";
import { estimateMw } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine estimateMw.",
  inputSchema: z.object({
    action: z.enum(["New", "Modify", "Reuse", "Onboard"]),
    platform: z.enum(["Apigee", "MSA", "Fusion"]),
    size: z.enum(["S", "M", "C"]),
  }),
  async execute(input) {
    return estimateMw(input);
  },
});
