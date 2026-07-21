import { describe, expect, it } from "vitest";
import { classifyDocument } from "../agent/lib/classify-documents.js";
import {
  assertClassificationCase,
  CLASSIFICATION_CASES,
} from "../evals/data/classification-cases.js";

describe("classify_documents Stage 1 cases", () => {
  it.each(CLASSIFICATION_CASES)("$id", async (testCase) => {
    const result = await classifyDocument(testCase.input);
    expect(() => assertClassificationCase(result, testCase)).not.toThrow();
  });
});
