import { defineAgent } from "eve";
import { createEvalMockModel, isEvalMockEnabled } from "./lib/eval-mock-model.js";

export default defineAgent({
  // Claude via Vercel AI Gateway — configure AI_GATEWAY_API_KEY at deploy time.
  model: isEvalMockEnabled()
    ? createEvalMockModel()
    : "anthropic/claude-sonnet-4.6",
  // Bypass AI Gateway catalog lookup for compaction thresholds when metadata
  // is unavailable offline (Sonnet 4.6 context window per gateway catalog).
  modelContextWindowTokens: 1_000_000,
});
