import { scoreBa } from "@ia-agent/engine";
import type { ClassifyDocumentResult } from "../../agent/lib/classify-documents.js";
import { dimensionTolerance } from "../data/labelled-pairs.js";
import type { Stage1GoldCase, Stage2GoldCase } from "./bakeoff-gold.js";

export interface ClassifyPrediction {
  doc_type: ClassifyDocumentResult["doc_type"];
  checklist_coverage: ClassifyDocumentResult["checklist_coverage"];
}

export interface ExtractPrediction {
  fields: Array<{ id: string; status: string }>;
  popitScores?: {
    customer?: number;
    peopleProcess?: number;
    technology?: number;
    complexity?: number;
    cif?: number;
    cdf?: number;
  };
}

export interface Stage1DocScore {
  caseId: string;
  docTypeCorrect: boolean;
  requirementsCorrect: boolean;
  impactAreasCorrect: boolean;
  hldCorrect: boolean;
  checklistAccuracy: number;
}

export interface Stage2DocScore {
  caseId: string;
  fieldAccuracyPct: number;
  popitWithinTolerance: number;
  bandCorrect: boolean;
  totalScoreCorrect: boolean;
  gapFieldsFlagged: boolean;
}

export function scoreClassificationCase(
  gold: Stage1GoldCase,
  prediction: ClassifyPrediction,
): Stage1DocScore {
  const docTypeCorrect = prediction.doc_type === gold.gold.doc_type;
  const requirementsCorrect =
    prediction.checklist_coverage.requirements.status ===
    gold.gold.checklist_coverage.requirements.status;
  const impactAreasCorrect =
    prediction.checklist_coverage.impact_areas.status ===
    gold.gold.checklist_coverage.impact_areas.status;
  const hldCorrect =
    prediction.checklist_coverage.hld.status === gold.gold.checklist_coverage.hld.status;

  const checklistHits = [
    docTypeCorrect,
    requirementsCorrect,
    impactAreasCorrect,
    hldCorrect,
  ].filter(Boolean).length;

  return {
    caseId: gold.id,
    docTypeCorrect,
    requirementsCorrect,
    impactAreasCorrect,
    hldCorrect,
    checklistAccuracy: checklistHits / 4,
  };
}

export function scoreExtractionCase(
  gold: Stage2GoldCase,
  prediction: ExtractPrediction,
): Stage2DocScore {
  const goldFields = new Map(gold.fixture.fields.map((field) => [field.id, field.status]));
  const predFields = new Map(prediction.fields.map((field) => [field.id, field.status]));

  let matched = 0;
  let total = 0;
  for (const [fieldId, status] of goldFields) {
    total += 1;
    if (predFields.get(fieldId) === status) matched += 1;
  }
  const fieldAccuracyPct = total === 0 ? 100 : (matched / total) * 100;

  const popitWithinTolerance = prediction.popitScores
    ? dimensionTolerance(prediction.popitScores, gold.expected.dimensions)
    : 0;

  const score = scoreBa({
    customer: gold.expected.dimensions.cust,
    peopleProcess: gold.expected.dimensions.pp,
    technology: gold.expected.dimensions.tech,
    complexity: gold.expected.dimensions.comp,
    cif: gold.expected.dimensions.cif,
    cdf: gold.expected.dimensions.cdf,
    year: 2026,
  });

  const predictedScore = prediction.popitScores
    ? scoreBa({
        customer: prediction.popitScores.customer ?? 0,
        peopleProcess: prediction.popitScores.peopleProcess ?? 0,
        technology: prediction.popitScores.technology ?? 0,
        complexity: prediction.popitScores.complexity ?? 0,
        cif: prediction.popitScores.cif ?? 0,
        cdf: prediction.popitScores.cdf ?? 0,
        year: 2026,
      })
    : null;

  const gapFieldsFlagged =
    !gold.requiredGapFields?.length ||
    gold.requiredGapFields.every((fieldId) => predFields.get(fieldId) === "missing");

  return {
    caseId: gold.id,
    fieldAccuracyPct: Math.round(fieldAccuracyPct * 100) / 100,
    popitWithinTolerance,
    bandCorrect: predictedScore?.band === score.band,
    totalScoreCorrect: predictedScore?.totalScore === score.totalScore,
    gapFieldsFlagged,
  };
}

export function aggregateStage1(scores: Stage1DocScore[]) {
  const n = scores.length || 1;
  return {
    docTypeAccuracy: scores.filter((row) => row.docTypeCorrect).length / n,
    checklistAccuracy:
      scores.reduce((sum, row) => sum + row.checklistAccuracy, 0) / n,
    requirementsAccuracy: scores.filter((row) => row.requirementsCorrect).length / n,
    impactAreasAccuracy: scores.filter((row) => row.impactAreasCorrect).length / n,
    hldAccuracy: scores.filter((row) => row.hldCorrect).length / n,
  };
}

export function aggregateStage2(scores: Stage2DocScore[]) {
  const n = scores.length || 1;
  return {
    meanFieldAccuracyPct:
      scores.reduce((sum, row) => sum + row.fieldAccuracyPct, 0) / n,
    popitPassCount: scores.filter((row) => row.popitWithinTolerance >= 3).length,
    bandPassCount: scores.filter((row) => row.bandCorrect).length,
    totalScorePassCount: scores.filter((row) => row.totalScoreCorrect).length,
    gapPassCount: scores.filter((row) => row.gapFieldsFlagged).length,
  };
}

export function stage1Adequate(metrics: ReturnType<typeof aggregateStage1>): boolean {
  return metrics.docTypeAccuracy >= 0.875 && metrics.checklistAccuracy >= 0.8;
}

export function stage2Adequate(
  metrics: ReturnType<typeof aggregateStage2>,
  scores: Stage2DocScore[],
  gapCaseIds: string[],
): boolean {
  const gapOk = gapCaseIds.every(
    (caseId) => scores.find((row) => row.caseId === caseId)?.gapFieldsFlagged,
  );
  return (
    metrics.meanFieldAccuracyPct >= 95 &&
    metrics.popitPassCount >= 3 &&
    metrics.bandPassCount === 4 &&
    gapOk
  );
}
