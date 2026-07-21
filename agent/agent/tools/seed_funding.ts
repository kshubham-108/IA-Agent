import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine seedFunding.",
  inputSchema: z.object({ year: z.number().int().default(2026) }),
  async execute() {
    throw new Error("seed_funding not implemented — awaiting packages/engine (Agent 1)");
  },
});
