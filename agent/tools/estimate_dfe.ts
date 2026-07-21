import { defineTool } from "eve/tools";
import { z } from "zod";
import { estimateDfe } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine estimateDfe.",
  inputSchema: z.object({
    templateId: z.enum(["retainx", "o2t", "dfe-default"]),
    basePu: z.number().optional(),
  }),
  async execute(input) {
    return estimateDfe(input);
  },
});
