/**
 * Model slots per PROJECT_BRIEF §11 — env-overridable via AI Gateway ids.
 * Defaults updated by `pnpm bakeoff` (see model_bakeoff_report.md).
 */
export const DEFAULT_EXTRACT_MODEL = "google/gemini-3.6-flash";
export const DEFAULT_CLASSIFY_MODEL = "google/gemini-3.5-flash-lite";

export function resolveExtractModel(): string {
  return process.env.MODEL_EXTRACT?.trim() || DEFAULT_EXTRACT_MODEL;
}

export function resolveClassifyModel(): string {
  return process.env.MODEL_CLASSIFY?.trim() || DEFAULT_CLASSIFY_MODEL;
}

export function isEvalMockEnabled(): boolean {
  return process.env.EVE_MOCK_MODEL === "1";
}
