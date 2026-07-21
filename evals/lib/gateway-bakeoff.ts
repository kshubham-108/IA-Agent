import { createGateway, type GatewayLanguageModelEntry } from "@ai-sdk/gateway";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./paths.js";

const PLACEHOLDER_KEYS = new Set([
  "",
  "your_vercel_ai_gateway_key_here",
  "changeme",
  "xxx",
]);

export interface BakeoffModelCandidate {
  slot: "claude-quality" | "claude-fast" | "gemini-quality" | "gemini-fast";
  modelId: string;
  displayName: string;
  pricing: GatewayLanguageModelEntry["pricing"];
}

export function loadEnvLocal(): void {
  const path = join(REPO_ROOT, ".env.local");
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export function resolveGatewayApiKey(): string | null {
  loadEnvLocal();
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key || PLACEHOLDER_KEYS.has(key.toLowerCase())) return null;
  return key;
}

export function assertGatewayApiKey(): string {
  const key = resolveGatewayApiKey();
  if (!key) {
    throw new Error(
      [
        "AI_GATEWAY_API_KEY is not set or is still the placeholder in .env.local.",
        "Set a valid Vercel AI Gateway key, then rerun: pnpm bakeoff",
        "See PROJECT_BRIEF.md §12 and https://vercel.com/docs/ai-gateway",
      ].join("\n"),
    );
  }
  return key;
}

export function createBakeoffGateway(apiKey: string) {
  return createGateway({ apiKey });
}

function languageModels(models: GatewayLanguageModelEntry[]): GatewayLanguageModelEntry[] {
  return models.filter((entry) => !entry.modelType || entry.modelType === "language");
}

function firstAvailable(
  catalog: GatewayLanguageModelEntry[],
  preferredIds: string[],
): GatewayLanguageModelEntry | undefined {
  for (const id of preferredIds) {
    const match = catalog.find((entry) => entry.id === id);
    if (match) return match;
  }
  return undefined;
}

function fallbackByTier(
  catalog: GatewayLanguageModelEntry[],
  provider: "anthropic" | "google",
  tier: "quality" | "fast",
): GatewayLanguageModelEntry | undefined {
  const providerModels = catalog.filter((entry) => entry.id.startsWith(`${provider}/`));
  const fastPattern = /haiku|flash|lite|mini|nano|fast/i;

  if (tier === "fast") {
    return (
      providerModels.find((entry) => fastPattern.test(entry.id)) ??
      providerModels.at(-1)
    );
  }

  return (
    providerModels.find((entry) => !fastPattern.test(entry.id)) ??
    providerModels[0]
  );
}

export async function resolveBakeoffCandidates(
  apiKey: string,
): Promise<BakeoffModelCandidate[]> {
  const gateway = createBakeoffGateway(apiKey);
  const { models } = await gateway.getAvailableModels();
  const catalog = languageModels(models);

  const picks: Array<{ slot: BakeoffModelCandidate["slot"]; entry?: GatewayLanguageModelEntry }> =
    [
      {
        slot: "claude-quality",
        entry: firstAvailable(catalog, [
          "anthropic/claude-sonnet-4.6",
          "anthropic/claude-sonnet-4.5",
          "anthropic/claude-sonnet-4",
        ]),
      },
      {
        slot: "claude-fast",
        entry: firstAvailable(catalog, [
          "anthropic/claude-haiku-4.5",
          "anthropic/claude-3-haiku",
        ]),
      },
      {
        slot: "gemini-quality",
        entry: firstAvailable(catalog, [
          "google/gemini-2.5-pro",
          "google/gemini-3.1-pro-preview",
          "google/gemini-3-pro-preview",
        ]),
      },
      {
        slot: "gemini-fast",
        entry: firstAvailable(catalog, [
          "google/gemini-2.5-flash",
          "google/gemini-2.5-flash-lite",
          "google/gemini-3.1-flash-lite",
        ]),
      },
    ];

  return picks.map(({ slot, entry }) => {
    const provider = slot.startsWith("claude") ? "anthropic" : "google";
    const tier = slot.endsWith("fast") ? "fast" : "quality";
    const resolved = entry ?? fallbackByTier(catalog, provider, tier);
    if (!resolved) {
      throw new Error(`Could not resolve ${slot} candidate from AI Gateway catalog`);
    }
    return {
      slot,
      modelId: resolved.id,
      displayName: resolved.name,
      pricing: resolved.pricing,
    };
  });
}

export function computeCostUsd(
  usage: { inputTokens?: number; outputTokens?: number },
  pricing: GatewayLanguageModelEntry["pricing"],
): number {
  if (!pricing) return 0;
  const inputRate = Number.parseFloat(pricing.input);
  const outputRate = Number.parseFloat(pricing.output);
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  return inputRate * inputTokens + outputRate * outputTokens;
}

/** Gateway catalog prices are USD/token; brief asks for £/doc — use BoE-friendly static FX for reporting. */
export function usdToGbp(usd: number): number {
  return usd * 0.79;
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)]!;
}
