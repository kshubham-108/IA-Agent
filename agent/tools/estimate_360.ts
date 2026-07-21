import { defineTool } from "eve/tools";
import { z } from "zod";
import { estimate360 } from "@ia-agent/engine";

export default defineTool({
  description: "Thin wrapper over packages/engine estimate360.",
  inputSchema: z.object({
    size: z.enum(["XS", "S", "M", "L", "XL"]),
  }),
  async execute(input) {
    return estimate360(input);
  },
});
