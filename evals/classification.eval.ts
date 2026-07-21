import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";
import { classifyDocument } from "../agent/lib/classify-documents.js";
import {
  assertClassificationCase,
  CLASSIFICATION_CASES,
} from "./data/classification-cases.js";

export default CLASSIFICATION_CASES.map((testCase) =>
  defineEval({
    description: `Stage 1 classify: ${testCase.description}`,
    tags: ["classification", "§10", testCase.id],
    metadata: { caseId: testCase.id },
    async test(t) {
      const result = await classifyDocument(testCase.input);
      try {
        assertClassificationCase(result, testCase);
        t.check(result.filename, equals(testCase.input.filename));
      } catch (error) {
        throw error;
      }
    },
  }),
);
