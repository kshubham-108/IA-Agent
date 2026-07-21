import { defineTool } from "eve/tools";
import { z } from "zod";
import { scoreBa } from "@ia-agent/engine";

export default defineTool({
  description:
    "Thin wrapper over packages/engine scoreBa — BA IIA scoring. Returns PU, band, duration from engine only.",
  inputSchema: z.object({
    customer: z.number().int(),
    peopleProcess: z.number().int(),
    technology: z.number().int(),
    complexity: z.number().int(),
    cif: z.number().int(),
    cdf: z.number().int(),
    year: z.number().int().default(2026),
  }),
  async execute(input) {
    return scoreBa(input);
  },
});
