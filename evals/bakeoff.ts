import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateObject } from "ai";
import { z } from "zod";
import {
  aggregateStage1,
  aggregateStage2,
  scoreClassificationCase,
  scoreExtractionCase,
  stage1Adequate,
  stage2Adequate,
  type ClassifyPrediction,
  type ExtractPrediction,
  type Stage1DocScore,
  type Stage2DocScore,
} from "./lib/bakeoff-scoring.js";
import { buildStage1GoldCases, buildStage2GoldCases } from "./lib/bakeoff-gold.js";
import {
  assertGatewayApiKey,
  computeCostUsd,
  createBakeoffGateway,
  percentile,
  resolveBakeoffCandidates,
  usdToGbp,
  type BakeoffModelCandidate,
} from "./lib/gateway-bakeoff.js";
import { REPO_ROOT } from "./lib/paths.js";

const REPORT_PATH = join(REPO_ROOT, "model_bakeoff_report.md");
const MODEL_SLOTS_PATH = join(REPO_ROOT, "agent/lib/model-slots.ts");
const CLASSIFY_TEXT_LIMIT = 14_000;
const EXTRACT_TEXT_LIMIT = 28_000;

const classifySchema = z.object({
  doc_type: z.enum([
    "vision_card",
    "heatmap",
    "hld",
    "iia_ba_template",
    "iia_sa_template",
    "ia_spec",
    "other",
  ]),
  checklist_coverage: z.object({
    requirements: z.object({
      status: z.enum(["pending", "checking", "partial", "satisfied", "contradictory"]),
      missing_fields: z.array(z.string()),
      evidence_span: z.string().nullable(),
    }),
    impact_areas: z.object({
      status: z.enum(["pending", "checking", "partial", "satisfied", "contradictory"]),
      missing_fields: z.array(z.string()),
      evidence_span: z.string().nullable(),
    }),
    hld: z.object({
      status: z.enum(["pending", "checking", "partial", "satisfied", "contradictory"]),
      missing_fields: z.array(z.string()),
      evidence_span: z.string().nullable(),
    }),
  }),
});

const extractSchema = z.object({
  formatVariant: z.enum(["prototype-2026", "numbered-prototype", "lean", "unknown"]),
  fields: z.array(
    z.object({
      id: z.string(),
      value: z.string().nullable(),
      evidence_span: z.string().nullable(),
      confidence: z.number().min(0).max(1),
      status: z.enum(["found", "inferred", "missing", "contradictory"]),
    }),
  ),
  popitScores: z.object({
    customer: z.number().int().min(0).max(5),
    peopleProcess: z.number().int().min(0).max(5),
    technology: z.number().int().min(0).max(5),
    complexity: z.number().int().min(0).max(5),
    cif: z.number().int().min(-7).max(7),
    cdf: z.number().int().min(-7).max(7),
  }),
});

interface RunMetrics {
  model: BakeoffModelCandidate;
  stage: "classify" | "extract";
  docScores: Stage1DocScore[] | Stage2DocScore[];
  latenciesMs: number[];
  costGbpPerDoc: number[];
  aggregate: ReturnType<typeof aggregateStage1> | ReturnType<typeof aggregateStage2>;
  adequate: boolean;
}

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}\n\n[… truncated for bake-off prompt …]`;
}

const CLASSIFY_SYSTEM = `You are Stage 1 of the IA Agent readiness pipeline.
Classify the upload and assess checklist coverage only. Do not estimate PU, cost, or duration.
Requirements checklist uses manifest field ids from iia-seed-funding (title, tracking_id, budget_ref, sponsor, proposer, products_in_scope, channels_processes_systems, current_state, problem_opportunity, future_vision, beneficiaries, exclusions, dependencies, journey_counts).
Impact areas checklist needs heatmap coverage. HLD checklist is satisfied only for hld or ia_spec doc types.
If scope statements conflict, mark requirements contradictory. If a field is absent, mark it missing — never guess.`;

const EXTRACT_SYSTEM = `You are Stage 2 Vision Card extraction for the IA Agent.
Extract manifest fields with evidence spans and POPIT dimension scores (0–5 for cust/pp/tech/comp; CIF/CDF adjustments -7..7).
Never output PU, £, band, or duration — only field statuses and integer POPIT inputs for the engine.
If a field is absent in the document, status must be "missing" (flag gap), not "found". Thin/lean cards often have many missing fields.`;

async function runClassificationDoc(
  gateway: ReturnType<typeof createBakeoffGateway>,
  modelId: string,
  filename: string,
  text: string,
): Promise<{
  prediction: ClassifyPrediction;
  latencyMs: number;
  usage: { inputTokens?: number; outputTokens?: number };
}> {
  const started = performance.now();
  const result = await generateObject({
    model: gateway(modelId),
    schema: classifySchema,
    system: CLASSIFY_SYSTEM,
    prompt: `Filename: ${filename}\n\nDocument text:\n${truncate(text, CLASSIFY_TEXT_LIMIT)}`,
  });
  const latencyMs = performance.now() - started;

  return {
    prediction: result.object,
    latencyMs,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    },
  };
}

async function runExtractionDoc(
  gateway: ReturnType<typeof createBakeoffGateway>,
  modelId: string,
  filename: string,
  text: string,
): Promise<{ prediction: ExtractPrediction; latencyMs: number; usage: { inputTokens?: number; outputTokens?: number } }> {
  const started = performance.now();
  const result = await generateObject({
    model: gateway(modelId),
    schema: extractSchema,
    system: EXTRACT_SYSTEM,
    prompt: `Vision card filename: ${filename}\n\nDocument text:\n${truncate(text, EXTRACT_TEXT_LIMIT)}`,
  });
  const latencyMs = performance.now() - started;

  return {
    prediction: {
      fields: result.object.fields,
      popitScores: result.object.popitScores,
    },
    latencyMs,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    },
  };
}

async function evaluateClassificationModel(
  candidate: BakeoffModelCandidate,
  gateway: ReturnType<typeof createBakeoffGateway>,
): Promise<RunMetrics> {
  const goldCases = await buildStage1GoldCases();
  const docScores: Stage1DocScore[] = [];
  const latenciesMs: number[] = [];
  const costGbpPerDoc: number[] = [];

  for (const gold of goldCases) {
    const { prediction, latencyMs, usage } = await runClassificationDoc(
      gateway,
      candidate.modelId,
      gold.filename,
      gold.text,
    );
    const costUsd = computeCostUsd(usage, candidate.pricing);
    docScores.push(scoreClassificationCase(gold, prediction));
    latenciesMs.push(latencyMs);
    costGbpPerDoc.push(usdToGbp(costUsd));
  }

  const aggregate = aggregateStage1(docScores);
  return {
    model: candidate,
    stage: "classify",
    docScores,
    latenciesMs,
    costGbpPerDoc,
    aggregate,
    adequate: stage1Adequate(aggregate),
  };
}

async function evaluateExtractionModel(
  candidate: BakeoffModelCandidate,
  gateway: ReturnType<typeof createBakeoffGateway>,
): Promise<RunMetrics> {
  const goldCases = buildStage2GoldCases();
  const gapCaseIds = goldCases
    .filter((row) => row.requiredGapFields?.length)
    .map((row) => row.id);
  const docScores: Stage2DocScore[] = [];
  const latenciesMs: number[] = [];
  const costGbpPerDoc: number[] = [];

  for (const gold of goldCases) {
    const { prediction, latencyMs, usage } = await runExtractionDoc(
      gateway,
      candidate.modelId,
      gold.visionCard,
      gold.text,
    );
    const costUsd = computeCostUsd(usage, candidate.pricing);
    docScores.push(scoreExtractionCase(gold, prediction));
    latenciesMs.push(latencyMs);
    costGbpPerDoc.push(usdToGbp(costUsd));
  }

  const aggregate = aggregateStage2(docScores);
  return {
    model: candidate,
    stage: "extract",
    docScores,
    latenciesMs,
    costGbpPerDoc,
    aggregate,
    adequate: stage2Adequate(aggregate, docScores, gapCaseIds),
  };
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatGbp(value: number): string {
  return `£${value.toFixed(4)}`;
}

function pickStage1Winner(runs: RunMetrics[]): BakeoffModelCandidate {
  const adequate = runs.filter((run) => run.adequate);
  const pool = adequate.length > 0 ? adequate : runs;
  return [...pool].sort((a, b) => {
    const costA = a.costGbpPerDoc.reduce((sum, value) => sum + value, 0) / a.costGbpPerDoc.length;
    const costB = b.costGbpPerDoc.reduce((sum, value) => sum + value, 0) / b.costGbpPerDoc.length;
    if (costA !== costB) return costA - costB;
    const aggA = a.aggregate as ReturnType<typeof aggregateStage1>;
    const aggB = b.aggregate as ReturnType<typeof aggregateStage1>;
    return aggB.checklistAccuracy - aggA.checklistAccuracy;
  })[0]!.model;
}

function pickStage2Winner(runs: RunMetrics[]): BakeoffModelCandidate {
  const adequate = runs.filter((run) => run.adequate);
  const pool = adequate.length > 0 ? adequate : runs;
  return [...pool].sort((a, b) => {
    const aggA = a.aggregate as ReturnType<typeof aggregateStage2>;
    const aggB = b.aggregate as ReturnType<typeof aggregateStage2>;
    if (aggB.meanFieldAccuracyPct !== aggA.meanFieldAccuracyPct) {
      return aggB.meanFieldAccuracyPct - aggA.meanFieldAccuracyPct;
    }
    if (aggB.bandPassCount !== aggA.bandPassCount) {
      return aggB.bandPassCount - aggA.bandPassCount;
    }
    const costA = a.costGbpPerDoc.reduce((sum, value) => sum + value, 0) / a.costGbpPerDoc.length;
    const costB = b.costGbpPerDoc.reduce((sum, value) => sum + value, 0) / b.costGbpPerDoc.length;
    return costA - costB;
  })[0]!.model;
}

export function buildBakeoffReportMarkdown(
  candidates: BakeoffModelCandidate[],
  classifyRuns: RunMetrics[],
  extractRuns: RunMetrics[],
  classifyWinner: BakeoffModelCandidate,
  extractWinner: BakeoffModelCandidate,
): string {
  const generatedAt = new Date().toISOString();

  const classifyRows = classifyRuns
    .map((run) => {
      const agg = run.aggregate as ReturnType<typeof aggregateStage1>;
      const meanCost =
        run.costGbpPerDoc.reduce((sum, value) => sum + value, 0) / run.costGbpPerDoc.length;
      return `| ${run.model.modelId} | ${pct(agg.docTypeAccuracy)} | ${pct(agg.checklistAccuracy)} | ${pct(agg.requirementsAccuracy)} | ${formatGbp(meanCost)} | ${percentile(run.latenciesMs, 50).toFixed(0)} | ${percentile(run.latenciesMs, 95).toFixed(0)} | ${run.adequate ? "yes" : "no"} |`;
    })
    .join("\n");

  const extractRows = extractRuns
    .map((run) => {
      const agg = run.aggregate as ReturnType<typeof aggregateStage2>;
      const meanCost =
        run.costGbpPerDoc.reduce((sum, value) => sum + value, 0) / run.costGbpPerDoc.length;
      return `| ${run.model.modelId} | ${agg.meanFieldAccuracyPct.toFixed(1)}% | ${agg.popitPassCount}/4 | ${agg.bandPassCount}/4 | ${agg.gapPassCount} | ${formatGbp(meanCost)} | ${percentile(run.latenciesMs, 50).toFixed(0)} | ${percentile(run.latenciesMs, 95).toFixed(0)} | ${run.adequate ? "yes" : "no"} |`;
    })
    .join("\n");

  return `# Model bake-off report (PROJECT_BRIEF §11)

Generated: ${generatedAt}

## Summary

| Stage | Env slot | Recommended model | Rationale |
|---|---|---|---|
| Stage 1 — \`classify_documents\` | \`MODEL_CLASSIFY\` | \`${classifyWinner.modelId}\` | Cheapest adequate model on 16-doc classification matrix (doc type + checklist accuracy ≥80%, type ≥87.5%). |
| Stage 2 — extract / estimate | \`MODEL_EXTRACT\` | \`${extractWinner.modelId}\` | Best extraction accuracy on §5b labelled pairs (field ≥95%, POPIT ≥3/4, band 4/4, gap flags correct). |

## Candidate matrix (resolved from live AI Gateway catalog)

| Slot | Model id | Display name |
|---|---|---|
${candidates.map((candidate) => `| ${candidate.slot} | \`${candidate.modelId}\` | ${candidate.displayName} |`).join("\n")}

## Stage 1 — classification (12 sampled corpus cards + 4 labelled)

Gold labels: deterministic manifest classifier (\`agent/lib/classify-documents.ts\`) on parsed corpus text.

| Model | Doc-type accuracy | Checklist accuracy | Requirements accuracy | Mean £/doc | p50 ms | p95 ms | Adequate |
|---|---:|---:|---:|---:|---:|---:|:---:|
${classifyRows}

**Targets:** doc-type ≥87.5%, checklist ≥80% (cheapest adequate wins).

## Stage 2 — extraction (§5b labelled pairs)

| Model | Field accuracy | POPIT pass | Band pass | Gap pass | Mean £/doc | p50 ms | p95 ms | Adequate |
|---|---:|---:|---:|---:|---:|---:|---:|:---:|
${extractRows}

**Targets:** field ≥95%, POPIT ≥3/4 pairs (≥3 dims ±1), band 4/4, gap-flagging correct on required cases.

## Cost methodology

- Token costs derived from AI Gateway catalog pricing (USD/token) × usage metadata from \`generateObject\`.
- £/doc uses static FX 0.79 USD→GBP for mentor-facing reporting; confirm live FX for finance.
- Stage 1 cost uses estimated tokens when provider omits usage on short classification calls.

## Wired defaults

Update \`agent/lib/model-slots.ts\`:

- \`DEFAULT_CLASSIFY_MODEL = "${classifyWinner.modelId}"\`
- \`DEFAULT_EXTRACT_MODEL = "${extractWinner.modelId}"\`

Override at runtime via \`MODEL_CLASSIFY\` / \`MODEL_EXTRACT\` env vars.
`;
}

function wireModelSlotDefaults(
  classifyWinner: BakeoffModelCandidate,
  extractWinner: BakeoffModelCandidate,
): void {
  const source = readFileSync(MODEL_SLOTS_PATH, "utf8");
  const updated = source
    .replace(
      /export const DEFAULT_CLASSIFY_MODEL = "[^"]+";/,
      `export const DEFAULT_CLASSIFY_MODEL = "${classifyWinner.modelId}";`,
    )
    .replace(
      /export const DEFAULT_EXTRACT_MODEL = "[^"]+";/,
      `export const DEFAULT_EXTRACT_MODEL = "${extractWinner.modelId}";`,
    );
  writeFileSync(MODEL_SLOTS_PATH, updated, "utf8");
}

export async function runBakeoff(): Promise<{ reportPath: string; classifyWinner: BakeoffModelCandidate; extractWinner: BakeoffModelCandidate }> {
  const apiKey = assertGatewayApiKey();
  const gateway = createBakeoffGateway(apiKey);
  const candidates = await resolveBakeoffCandidates(apiKey);

  console.log("Resolved bake-off candidates:");
  for (const candidate of candidates) {
    console.log(`  ${candidate.slot}: ${candidate.modelId}`);
  }

  const classifyRuns: RunMetrics[] = [];
  for (const candidate of candidates) {
    console.log(`Stage 1 — ${candidate.modelId} …`);
    classifyRuns.push(await evaluateClassificationModel(candidate, gateway));
  }

  const extractRuns: RunMetrics[] = [];
  for (const candidate of candidates) {
    console.log(`Stage 2 — ${candidate.modelId} …`);
    extractRuns.push(await evaluateExtractionModel(candidate, gateway));
  }

  const classifyWinner = pickStage1Winner(classifyRuns);
  const extractWinner = pickStage2Winner(extractRuns);
  const markdown = buildBakeoffReportMarkdown(
    candidates,
    classifyRuns,
    extractRuns,
    classifyWinner,
    extractWinner,
  );
  writeFileSync(REPORT_PATH, markdown, "utf8");
  wireModelSlotDefaults(classifyWinner, extractWinner);

  return { reportPath: REPORT_PATH, classifyWinner, extractWinner };
}

if (import.meta.main) {
  runBakeoff()
    .then(({ reportPath, classifyWinner, extractWinner }) => {
      console.log(`\nWrote ${reportPath}`);
      console.log(`Recommended MODEL_CLASSIFY=${classifyWinner.modelId}`);
      console.log(`Recommended MODEL_EXTRACT=${extractWinner.modelId}`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exitCode = 1;
    });
}
