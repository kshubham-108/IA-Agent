import { describe, expect, it } from "vitest";
import { assertNoKnowledgeLeaks, findKnowledgeLeaks } from "../scripts/check-knowledge-leak.js";

describe("agent knowledge leak check", () => {
  it("has no calibrated numbers from packages/rules in skills or instructions", () => {
    const leaks = findKnowledgeLeaks();
    expect(leaks).toEqual([]);
    assertNoKnowledgeLeaks();
  });
});
