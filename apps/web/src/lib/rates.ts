import fs from "node:fs";
import path from "node:path";

import type { RatesMap } from "./types";

const DEFAULT_YEAR = 2026;

function parseRatesYaml(content: string): Record<number, number> {
  const match = content.match(/tcs_consumer_data:\s*\{([^}]+)\}/);
  if (!match?.[1]) {
    throw new Error("Could not parse tcs_consumer_data from rates.yaml");
  }

  const rates: Record<number, number> = {};
  for (const part of match[1].split(",")) {
    const [yearStr, valueStr] = part.split(":").map((s) => s.trim());
    if (!yearStr || !valueStr) continue;
    rates[Number(yearStr)] = Number(valueStr);
  }

  return rates;
}

function resolveRatesPath(): string {
  const candidates = [
    path.join(process.cwd(), "../../packages/rules/rates.yaml"),
    path.join(process.cwd(), "../../../packages/rules/rates.yaml"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error("rates.yaml not found in packages/rules");
}

let cachedRates: RatesMap | undefined;

export function loadRates(): RatesMap {
  if (cachedRates) return cachedRates;

  const content = fs.readFileSync(resolveRatesPath(), "utf-8");
  cachedRates = {
    tcs_consumer_data: parseRatesYaml(content),
    defaultYear: DEFAULT_YEAR,
  };

  return cachedRates;
}

export function getPurForYear(year: number): number {
  const rates = loadRates();
  const pur = rates.tcs_consumer_data[year];
  if (pur === undefined) {
    throw new Error(`No PUR configured for year ${year}`);
  }
  return pur;
}

export function getAvailableYears(): number[] {
  const rates = loadRates();
  return Object.keys(rates.tcs_consumer_data)
    .map(Number)
    .sort((a, b) => a - b);
}
