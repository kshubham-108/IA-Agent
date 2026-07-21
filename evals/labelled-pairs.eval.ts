import { defineEval } from "eve/evals";
import { LABELLED_PAIRS, dimensionTolerance, type LabelledPairCase } from "./data/labelled-pairs.js";

function assertScoreBa(
  t: Parameters<Parameters<typeof defineEval>[0]["test"]>[0],
  pair: LabelledPairCase,
) {
  t.calledTool("score_ba", {
    input: (input) => {
      const typed = input as Record<string, number>;
      return dimensionTolerance(typed, pair.expected.dimensions) >= pair.minDimensionsWithinTolerance;
    },
    output: (value) => {
      const result = value as {
        totalScore?: number;
        band?: string;
        pu?: number;
      };
      return (
        result.totalScore === pair.expected.totalScore &&
        result.band === pair.expected.band &&
        result.pu === pair.expected.pu2026
      );
    },
  });
}

function assertGapFlagging(
  t: Parameters<Parameters<typeof defineEval>[0]["test"]>[0],
  pair: LabelledPairCase,
) {
  if (!pair.requiredGapFields?.length) return;

  t.calledTool("gap_report", {
    output: (value) => {
      const report = value as { gaps?: Array<{ fieldId: string }> };
      const gapIds = new Set(report.gaps?.map((gap) => gap.fieldId) ?? []);
      return pair.requiredGapFields!.every((fieldId) => gapIds.has(fieldId));
    },
  });

  t.calledTool("confidence_band");
}

export default LABELLED_PAIRS.map((pair) =>
  defineEval({
    description: `§5b labelled pair: ${pair.id} → ${pair.expected.totalScore} / ${pair.expected.pu2026} PU @2026`,
    tags: ["labelled-pair", "§5b", pair.formatVariant],
    metadata: {
      visionCard: pair.visionCard,
      expected: pair.expected,
    },
    async test(t) {
      await t.send(`FLOW: labelled-pair EVAL_PAIR:${pair.id}`);
      t.succeeded();
      t.calledTool("extract_vision_card", {
        input: { documentPath: pair.fixturePath },
      });
      t.calledTool("gap_report");
      assertGapFlagging(t, pair);
      assertScoreBa(t, pair);
    },
  }),
);
