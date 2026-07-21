import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse as parseYaml } from "yaml";

const REPO_ROOT = join(import.meta.dirname, "..");
const RULES_DIR = join(REPO_ROOT, "packages/rules");
const AGENT_PATHS = [
  join(REPO_ROOT, "agent/instructions.md"),
  ...readdirSync(join(REPO_ROOT, "agent/skills"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(REPO_ROOT, "agent/skills", name)),
];

export interface KnowledgeLeak {
  file: string;
  token: string;
  sourceRule: string;
}

function walkYamlFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...walkYamlFiles(path));
      continue;
    }
    if (entry.endsWith(".yaml") || entry.endsWith(".yml")) {
      files.push(path);
    }
  }
  return files;
}

function collectNumericValues(value: unknown, out: Set<string>): void {
  if (typeof value === "number" && Number.isFinite(value)) {
    out.add(formatNumber(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectNumericValues(item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectNumericValues(nested, out);
    }
  }
}

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(value);
}

function isExcludedToken(token: string): boolean {
  if (!/^-?\d+(?:\.\d+)?$/.test(token)) return true;
  const value = Number(token);
  if (!Number.isFinite(value)) return true;

  // Planning years appear in filenames and prose — not calibrated table leaks.
  if (Number.isInteger(value) && value >= 2020 && value <= 2035) return true;

  // Band boundaries and small ordinals used in methodology lists.
  if (Number.isInteger(value) && value >= 0 && value <= 20) return true;

  return false;
}

function loadSensitiveRuleNumbers(): Map<string, Set<string>> {
  const byRule = new Map<string, Set<string>>();
  for (const file of walkYamlFiles(RULES_DIR)) {
    const parsed = parseYaml(readFileSync(file, "utf8"));
    const numbers = new Set<string>();
    collectNumericValues(parsed, numbers);
    const filtered = [...numbers].filter((token) => !isExcludedToken(token));
    if (filtered.length > 0) {
      byRule.set(relative(REPO_ROOT, file), new Set(filtered));
    }
  }
  return byRule;
}

function tokenPattern(token: string): RegExp {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (token.includes(".")) {
    return new RegExp(`(?<![\\d.])${escaped}(?![\\d.])`);
  }
  return new RegExp(`(?<![\\d.])${escaped}(?![\\d])`);
}

export function findKnowledgeLeaks(): KnowledgeLeak[] {
  const agentCorpus = AGENT_PATHS.map((path) => ({
    path: relative(REPO_ROOT, path),
    text: readFileSync(path, "utf8"),
  }));

  const leaks: KnowledgeLeak[] = [];
  for (const [rulePath, tokens] of loadSensitiveRuleNumbers()) {
    for (const token of tokens) {
      const pattern = tokenPattern(token);
      for (const doc of agentCorpus) {
        if (pattern.test(doc.text)) {
          leaks.push({ file: doc.path, token, sourceRule: rulePath });
        }
      }
    }
  }
  return leaks;
}

export function assertNoKnowledgeLeaks(): void {
  const leaks = findKnowledgeLeaks();
  if (leaks.length === 0) return;

  const lines = leaks.map(
    (leak) => `- ${leak.file}: found "${leak.token}" from ${leak.sourceRule}`,
  );
  throw new Error(
    `Calibrated rule numbers leaked into agent knowledge:\n${lines.join("\n")}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  assertNoKnowledgeLeaks();
  console.log("Knowledge leak check passed.");
}
