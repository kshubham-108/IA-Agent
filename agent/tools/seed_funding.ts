import { defineTool } from "eve/tools";
import { z } from "zod";
import { seedFunding } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine seedFunding.",
  inputSchema: z.object({ year: z.number().int().default(2026) }),
  async execute(input) {
    return seedFunding(input);
  },
});
