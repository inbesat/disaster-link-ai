// ---------------------------------------------------------------------
// lib/ai-bridge/estimate-tokens.test.ts
// Phase 1 · token estimator sanity checks (4 chars-per-token heuristic).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { estimateTokens } from "./estimate-tokens";

describe("estimateTokens", () => {
  it("returns 0 for empty input", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("counts ~4 chars per token", () => {
    expect(estimateTokens("hello world")).toBe(3); // 11 chars → ceil(11/4)
    expect(estimateTokens("a".repeat(100))).toBe(25);
  });

  it("never returns zero for a non-empty string", () => {
    expect(estimateTokens("hi")).toBe(1);
  });
});