import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Find nearest Wall of Reference neighbours for calibration context.",
  inputSchema: z.object({
    projectDescription: z.string(),
    limit: z.number().int().min(1).max(10).default(3),
  }),
  async execute() {
    throw new Error(
      "wall_of_reference_neighbours not implemented — awaiting packages/engine (Agent 1)",
    );
  },
});
