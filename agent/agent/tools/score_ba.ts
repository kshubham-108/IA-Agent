import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine scoreBa — BA IIA scoring.",
  inputSchema: z.object({
    customer: z.number().int(),
    peopleProcess: z.number().int(),
    technology: z.number().int(),
    complexity: z.number().int(),
    cif: z.number().int(),
    cdf: z.number().int(),
    year: z.number().int().default(2026),
  }),
  async execute(_input) {
    // Agent 2: import { scoreBa } from "@ia-agent/engine"
    throw new Error("score_ba not implemented — awaiting packages/engine (Agent 1)");
  },
});
