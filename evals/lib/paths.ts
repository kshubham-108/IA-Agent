import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function findRepoRoot(start?: string): string {
  const candidates = [
    start,
    process.cwd(),
    dirname(fileURLToPath(import.meta.url)),
  ].filter(Boolean) as string[];

  for (const initial of candidates) {
    let dir = initial;
    while (dir !== dirname(dir)) {
      if (existsSync(join(dir, "PROJECT_BRIEF.md")) && existsSync(join(dir, "corpus"))) {
        return dir;
      }
      dir = dirname(dir);
    }
  }

  throw new Error("Could not locate repo root (expected PROJECT_BRIEF.md + corpus/)");
}

export const REPO_ROOT = findRepoRoot();
