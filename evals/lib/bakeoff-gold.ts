import { readFileSync } from "node:fs";
import { join } from "node:path";
import { classifyDocument } from "../../agent/lib/classify-documents.js";
import type { ClassifyDocumentResult } from "../../agent/lib/classify-documents.js";
import { LABELLED_PAIRS } from "../data/labelled-pairs.js";
import { REPO_ROOT } from "./paths.js";

const CLASSIFICATION_SAMPLE_SEED = 42;
const CLASSIFICATION_SAMPLE_SIZE = 12;

interface VisionCardIndex {
  cards: Array<{
    filename: string;
    parsedTextPath: string;
    formatVariant: string;
  }>;
}

export interface Stage1GoldCase {
  id: string;
  filename: string;
  text: string;
  source: "labelled" | "sampled";
  gold: ClassifyDocumentResult;
}

export interface Stage2GoldCase {
  id: string;
  visionCard: string;
  text: string;
  fixturePath: string;
  fixture: FixtureGold;
  expected: (typeof LABELLED_PAIRS)[number]["expected"];
  requiredGapFields?: string[];
}

interface FixtureGold {
  formatVariant: string;
  fields: Array<{ id: string; status: string; value?: string | null }>;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadVisionCardIndex(): VisionCardIndex {
  return JSON.parse(
    readFileSync(join(REPO_ROOT, "corpus/vision-cards-index.json"), "utf8"),
  ) as VisionCardIndex;
}

function loadParsedText(relativePath: string): string {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

function normalizeFilename(name: string): string {
  return name.toLowerCase().replace(/[_\s-]+/g, " ");
}

function findParsedTextForVisionCard(filename: string): string {
  const index = loadVisionCardIndex();
  const stem = filename
    .replace(/\.(docx|pdf|xlsx)$/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const card =
    index.cards.find((entry) => normalizeFilename(entry.filename) === stem) ??
    index.cards.find((entry) => {
      const entryStem = normalizeFilename(entry.filename.replace(/\.(docx|pdf|xlsx)$/i, ""));
      return entryStem.includes(stem.slice(0, 24)) || stem.includes(entryStem.slice(0, 24));
    });

  if (!card) {
    throw new Error(`No parsed corpus text found for labelled vision card: ${filename}`);
  }
  return loadParsedText(card.parsedTextPath);
}

function sampleCorpusCards(): VisionCardIndex["cards"] {
  const index = loadVisionCardIndex();
  const labelledNames = new Set(
    LABELLED_PAIRS.flatMap((pair) => [normalizeFilename(pair.visionCard)]),
  );

  const pool = index.cards.filter((card) => {
    const normalized = normalizeFilename(card.filename);
    return ![...labelledNames].some((label) => normalized.includes(label.slice(0, 18)));
  });

  const rng = mulberry32(CLASSIFICATION_SAMPLE_SEED);
  return [...pool].sort(() => rng() - 0.5).slice(0, CLASSIFICATION_SAMPLE_SIZE);
}

async function goldClassify(
  filename: string,
  text: string,
): Promise<ClassifyDocumentResult> {
  return classifyDocument({ filename, text });
}

export async function buildStage1GoldCases(): Promise<Stage1GoldCase[]> {
  const cases: Stage1GoldCase[] = [];

  for (const pair of LABELLED_PAIRS) {
    const text = findParsedTextForVisionCard(pair.visionCard);
    cases.push({
      id: `labelled-${pair.id}`,
      filename: pair.visionCard,
      text,
      source: "labelled",
      gold: await goldClassify(pair.visionCard, text),
    });
  }

  for (const card of sampleCorpusCards()) {
    const text = loadParsedText(card.parsedTextPath);
    cases.push({
      id: `sample-${card.filename}`,
      filename: card.filename,
      text,
      source: "sampled",
      gold: await goldClassify(card.filename, text),
    });
  }

  return cases;
}

export function buildStage2GoldCases(): Stage2GoldCase[] {
  return LABELLED_PAIRS.map((pair) => {
    const text = findParsedTextForVisionCard(pair.visionCard);
    const fixture = JSON.parse(
      readFileSync(join(REPO_ROOT, pair.fixturePath), "utf8"),
    ) as FixtureGold;

    return {
      id: pair.id,
      visionCard: pair.visionCard,
      text,
      fixturePath: pair.fixturePath,
      fixture,
      expected: pair.expected,
      requiredGapFields: pair.requiredGapFields,
    };
  });
}
