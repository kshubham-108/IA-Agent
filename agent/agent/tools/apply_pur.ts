import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine applyPur.",
  inputSchema: z.object({
    pu: z.number(),
    year: z.number().int().default(2026),
  }),
  async execute() {
    throw new Error("apply_pur not implemented — awaiting packages/engine (Agent 1)");
  },
});
