import { defineAgent } from "eve";

export default defineAgent({
  name: "ia-estimation-agent",
  // Claude via Vercel AI Gateway — configure gateway env vars at deploy time.
  model: "anthropic/claude-sonnet-4",
});
