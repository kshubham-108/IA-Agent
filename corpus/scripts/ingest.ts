/**
 * Build corpus/wall_of_reference.json and vision-cards-index.json from source files.
 * Run: pnpm ingest-corpus
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import type { VisionCardFormatVariant } from "@ia-agent/extraction-schemas";

const ROOT = join(import.meta.dirname, "../..");
const CORPUS = join(ROOT, "corpus");
const VISION_DIR = join(CORPUS, "vision-cards");
const PARSED_DIR = join(CORPUS, "vision-cards-parsed");
const XLSX_PATH = join(CORPUS, "Wall of Reference - Calibrated Projects.xlsx");

const EXCLUDED_CALIBRATION = ["data-ncc-phase-4", "data-helix-datalake"] as const;

const PROJECT_ID_MAP: Record<string, string> = {
  "CCS Phase 2": "data-ccs-phase-2",
  "OFCOM Provider Net Act Equivalent for 360 Customers": "data-ofcom-net-act",
  "O2 Helix CMDB Integration": "data-helix-cmdb",
  "EDH FDP Data Quality Framework": "data-edh-fdp-dq",
  "ACE Landing PAD migration": "data-ace-landing-pad",
  "NCC Phase 4 Del": "data-ncc-phase-4",
  "Req for Data IA Helix Datalake": "data-helix-datalake",
  "Phase 2 CPE Inventory Project": "data-cpe-inventory",
  "Losing Provider Logic": "data-losing-provider",
  "Bulk Diagnostic API": "data-bulk-diagnostic",
  Picasso: "data-picasso",
  "Augustus Bill Ops": "data-augustus-bill-ops",
  "Apollo as an AO FRAUD reporting": "data-apollo-fraud",
  "EDH > GCP": "data-edh-gcp",
  "Netpulse > GCP": "data-netpulse-gcp",
  "My O2 Mobile App Rebuild": "consumer-myo2",
  RetainX: "consumer-retainx",
  "PayG Transformation": "consumer-payg-transformation",
  "PayG Communication": "consumer-payg-comms",
  "BSS Service Comms": "consumer-bss-comms",
  "O2.co.uk Transformation": "consumer-o2-website",
  "O2.co.uk Transformation ": "consumer-o2-website",
  "O2 Marketing Transformation": "consumer-o2-marketing",
  "APIGee onboarding API": "small-apigee",
  "APIGee onboarding API ": "small-apigee",
  "Migration of 10 content pages": "small-10-pages",
  "Affirm Onboarding": "small-affirm",
  "Migration from a legacy page within 360 to DFE web page for top up":
    "small-360-dfe-topup",
  "Recycle Arnold": "small-recycle",
};

function slugId(project: string): string {
  const base = project
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, 64) || createHash("sha1").update(project).digest("hex").slice(0, 12);
}

function detectFormatVariant(filename: string, text: string): VisionCardFormatVariant {
  const probe = `${filename} ${text.slice(0, 8000)}`.toLowerCase();
  if (probe.includes("§1.1") || probe.includes("smart outcome")) {
    return "numbered-prototype";
  }
  if (probe.includes("lean vision") || probe.includes("sbd phase 2")) {
    return "lean";
  }
  if (
    probe.includes("idea tracking") ||
    probe.includes("prototype vision card 2026") ||
    probe.includes("vision_card_template 2026") ||
    probe.includes("vision card template 2026")
  ) {
    return "prototype-2026";
  }
  return "unknown";
}

function buildWallOfReference() {
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = workbook.Sheets["Wall of Reference - TCS"];
  if (!sheet) {
    throw new Error("Missing TCS sheet in Wall of Reference xlsx");
  }
  const matrix = XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: "",
  });

  const rows = matrix
    .slice(6)
    .filter((row) => row[3])
    .map((row, index) => {
      const projectName = String(row[3]).trim();
      const rowId =
        PROJECT_ID_MAP[projectName] ??
        PROJECT_ID_MAP[`${projectName} `] ??
        slugId(projectName);
      const pu = Number(row[7]);
      const estimatedCostGbp = Math.round(Number(row[8]) * 100) / 100;
      const actualCostGbp = Math.round(Number(row[9]) * 100) / 100;
      return {
        id: rowId,
        lot: String(row[1]).trim(),
        domain: String(row[2]).trim(),
        project: projectName,
        size: String(row[5]).trim(),
        scopeSummary: String(row[6]).trim(),
        pu,
        estimatedCostGbp,
        actualCostGbp,
        variance: row[10] === "" ? null : Number(row[10]),
        excludeFromCalibration: (EXCLUDED_CALIBRATION as readonly string[]).includes(rowId),
        provenance: {
          ruleId: "wall-of-reference.xlsx",
          evidenceSpan: `TCS sheet row ${index + 7}: ${projectName}`,
        },
      };
    });

  const smallItems = rows.filter((row) => row.id.startsWith("small-"));
  return {
    pur: 425.52,
    source: "corpus/Wall of Reference - Calibrated Projects.xlsx",
    sheet: "Wall of Reference - TCS",
    generatedAt: new Date().toISOString(),
    excludedFromCalibration: [...EXCLUDED_CALIBRATION],
    exclusionReason: "Infosys delivery / escalation discounts (§3A)",
    rows,
    smallChangePack: {
      items: smallItems.map((row) => ({
        id: row.id,
        pu: row.pu,
        costGbp: row.estimatedCostGbp,
      })),
      totalPu: smallItems.reduce((sum, row) => sum + row.pu, 0),
      totalCostGbp: Math.round(smallItems.reduce((sum, row) => sum + row.estimatedCostGbp, 0) * 100) / 100,
    },
  };
}

async function extractText(path: string, filename: string): Promise<string> {
  const buffer = readFileSync(path);
  if (filename.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (filename.endsWith(".pdf")) {
    const result = await pdfParse(buffer);
    return result.text;
  }
  return "";
}

async function buildVisionCardsIndex() {
  mkdirSync(PARSED_DIR, { recursive: true });
  const files = readdirSync(VISION_DIR).filter((name) =>
    /\.(docx|pdf)$/i.test(name),
  );

  const cards = [];
  for (const filename of files.sort()) {
    const path = join(VISION_DIR, filename);
    const text = await extractText(path, filename);
    const stem = basename(filename, /\.(docx|pdf)$/i.exec(filename)?.[0] ?? "");
    const parsedTextPath = join(PARSED_DIR, `${stem}.txt`);
    writeFileSync(parsedTextPath, text, "utf8");
    cards.push({
      id: createHash("sha1").update(filename).digest("hex").slice(0, 12),
      filename,
      relativePath: `corpus/vision-cards/${filename}`,
      parsedTextPath: `corpus/vision-cards-parsed/${stem}.txt`,
      extension: filename.split(".").pop()?.toLowerCase() ?? "unknown",
      formatVariant: detectFormatVariant(filename, text),
      sizeBytes: statSync(path).size,
      textLength: text.length,
      textPreview: text.slice(0, 240).replace(/\n/g, " "),
    });
  }

  const formatVariantCounts: Record<string, number> = {};
  for (const card of cards) {
    formatVariantCounts[card.formatVariant] =
      (formatVariantCounts[card.formatVariant] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    sourceDir: "corpus/vision-cards",
    count: cards.length,
    formatVariantCounts,
    cards,
  };
}

async function main() {
  const wall = buildWallOfReference();
  writeFileSync(join(CORPUS, "wall_of_reference.json"), `${JSON.stringify(wall, null, 2)}\n`);
  const index = await buildVisionCardsIndex();
  writeFileSync(join(CORPUS, "vision-cards-index.json"), `${JSON.stringify(index, null, 2)}\n`);
  console.log(`Wrote corpus/wall_of_reference.json (${wall.rows.length} rows)`);
  console.log(`Wrote corpus/vision-cards-index.json (${index.count} vision cards)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
