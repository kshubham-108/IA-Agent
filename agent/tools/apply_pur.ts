import { defineTool } from "eve/tools";
import { z } from "zod";
import { applyPur } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine applyPur.",
  inputSchema: z.object({
    pu: z.number(),
    year: z.number().int().default(2026),
  }),
  async execute(input) {
    return applyPur(input);
  },
});
