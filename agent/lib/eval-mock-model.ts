import { mockModel } from "eve/evals";
import { LABELLED_PAIRS, type LabelledPairCase } from "../../evals/data/labelled-pairs.js";

interface ToolResult {
  name?: string;
  output?: unknown;
}

function findCase(message: string): LabelledPairCase | undefined {
  const match = message.match(/EVAL_PAIR:([a-z]+)/i);
  if (!match) return undefined;
  return LABELLED_PAIRS.find((pair) => pair.id === match[1]);
}

function fieldIdsFromExtract(output: unknown): string[] {
  if (!output || typeof output !== "object") return [];
  const fields = (output as { fields?: Array<{ id: string; status?: string }> }).fields ?? [];
  return fields
    .filter((field) => field.status === "found")
    .map((field) => field.id);
}

function scoreInputFromExpected(expected: LabelledPairCase["expected"]) {
  return {
    customer: expected.dimensions.cust,
    peopleProcess: expected.dimensions.pp,
    technology: expected.dimensions.tech,
    complexity: expected.dimensions.comp,
    cif: expected.dimensions.cif,
    cdf: expected.dimensions.cdf,
    year: 2026,
  };
}

/**
 * Deterministic fixture model for §5b labelled-pair evals.
 * Enabled when EVE_MOCK_MODEL=1 (see package.json eval script).
 */
export function createEvalMockModel() {
  return mockModel(({ lastUserMessage, toolResults }) => {
    const pair = findCase(lastUserMessage);
    if (!pair) {
      return {
        text: "Provide EVAL_PAIR:<id> to run a labelled Vision Card eval case.",
      };
    }

    const completedTools = (toolResults as ToolResult[]).map((result) => result.name);

    if (!completedTools.includes("extract_vision_card")) {
      return {
        toolCalls: [
          {
            name: "extract_vision_card",
            input: { documentPath: pair.fixturePath },
          },
        ],
      };
    }

    const extractResult = (toolResults as ToolResult[]).find(
      (result) => result.name === "extract_vision_card",
    )?.output;
    const extractedFieldIds = fieldIdsFromExtract(extractResult);

    if (!completedTools.includes("gap_report")) {
      return {
        toolCalls: [
          {
            name: "gap_report",
            input: {
              manifestId: "iia-seed-funding",
              extractedFieldIds,
            },
          },
        ],
      };
    }

    const gapResult = (toolResults as ToolResult[]).find(
      (result) => result.name === "gap_report",
    )?.output as { coverage?: number } | undefined;

    if (!completedTools.includes("score_ba")) {
      return {
        toolCalls: [
          {
            name: "score_ba",
            input: scoreInputFromExpected(pair.expected),
          },
        ],
      };
    }

    const scoreResult = (toolResults as ToolResult[]).find(
      (result) => result.name === "score_ba",
    )?.output as { pu?: number; band?: string; totalScore?: number } | undefined;

    if (!completedTools.includes("confidence_band")) {
      const scoreResult = (toolResults as ToolResult[]).find(
        (result) => result.name === "score_ba",
      )?.output as { pu?: number } | undefined;
      return {
        toolCalls: [
          {
            name: "confidence_band",
            input: {
              pointEstimate: (scoreResult?.pu ?? 0) * 362,
              flow: "iia",
              manifestCoverage: gapResult?.coverage ?? 0.5,
            },
          },
        ],
      };
    }

    return {
      text: [
        `Labelled pair ${pair.id} complete.`,
        `totalScore=${scoreResult?.totalScore}`,
        `band=${scoreResult?.band}`,
        `pu2026=${scoreResult?.pu}`,
      ].join(" "),
    };
  });
}

export function isEvalMockEnabled(): boolean {
  return process.env.EVE_MOCK_MODEL === "1";
}
