import { defineAgent } from "eve";
import { createEvalMockModel } from "./lib/eval-mock-model.js";
import {
  DEFAULT_CLASSIFY_MODEL,
  DEFAULT_EXTRACT_MODEL,
  isEvalMockEnabled,
  resolveExtractModel,
} from "./lib/model-slots.js";

export default defineAgent({
  // Stage 2 extraction / estimation — MODEL_EXTRACT (§11; default gemini-3.6-flash).
  model: isEvalMockEnabled() ? createEvalMockModel() : resolveExtractModel(),
  // Stage 1 classify_documents uses MODEL_CLASSIFY via resolveClassifyModel() in tools.
  // Defaults: classify=${DEFAULT_CLASSIFY_MODEL}, extract=${DEFAULT_EXTRACT_MODEL}
  // Bypass AI Gateway catalog lookup for compaction thresholds when metadata
  // is unavailable offline (Gemini 3.6 Flash context window per gateway catalog).
  modelContextWindowTokens: 1_000_000,
});
