import { defineTool } from "eve/tools";
import { z } from "zod";
import { wallOfReferenceNeighbours } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine wallOfReferenceNeighbours.",
  inputSchema: z.object({
    projectName: z.string(),
    limit: z.number().int().min(1).max(10).default(3),
  }),
  async execute(input) {
    return wallOfReferenceNeighbours(input);
  },
});
