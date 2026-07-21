import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";
import { scoreBa } from "@ia-agent/engine";
import { LABELLED_PAIRS } from "./data/labelled-pairs.js";

/** Deterministic engine golden checks for §5b PU values (no LLM). */
export default LABELLED_PAIRS.map((pair) =>
  defineEval({
    description: `Engine golden: ${pair.id} PU=${pair.expected.pu2026} band=${pair.expected.band}`,
    tags: ["engine-golden", "§5b"],
    async test(t) {
      const dims = pair.expected.dimensions;
      const result = scoreBa({
        customer: dims.cust,
        peopleProcess: dims.pp,
        technology: dims.tech,
        complexity: dims.comp,
        cif: dims.cif,
        cdf: dims.cdf,
        year: 2026,
      });

      t.check(result.totalScore, equals(pair.expected.totalScore));
      t.check(result.band, equals(pair.expected.band));
      t.check(result.pu, equals(pair.expected.pu2026));
    },
  }),
);
