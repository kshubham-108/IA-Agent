import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Thin wrapper over packages/engine estimate360.",
  inputSchema: z.object({ size: z.enum(["XS", "S", "M", "L", "XL"]) }),
  async execute() {
    throw new Error("estimate_360 not implemented — awaiting packages/engine (Agent 1)");
  },
});
