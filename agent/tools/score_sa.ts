import { defineTool } from "eve/tools";
import { z } from "zod";
import { scoreSa } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine scoreSa.",
  inputSchema: z.object({
    score: z.number().int(),
    year: z.number().int().default(2026),
  }),
  async execute(input) {
    return scoreSa(input);
  },
});
