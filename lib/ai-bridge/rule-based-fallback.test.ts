// ---------------------------------------------------------------------
// lib/ai-bridge/rule-based-fallback.test.ts — Phase 9 rule-based bot
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { RuleBasedFallback, RULE_RESPONSES, RULE_FALLBACK_RESPONSE } from "./rule-based-fallback";

describe("RULE_RESPONSES", () => {
  it("contains 50+ pre-written emergency responses", () => {
    expect(RULE_RESPONSES.length).toBeGreaterThanOrEqual(50);
  });

  it("every entry has at least one key and a non-empty response", () => {
    for (const entry of RULE_RESPONSES) {
      expect(entry.keys.length).toBeGreaterThan(0);
      expect(entry.response.trim().length).toBeGreaterThan(0);
    }
  });

  it("keys are lowercase so normalization is deterministic", () => {
    for (const entry of RULE_RESPONSES) {
      for (const key of entry.keys) expect(key).toBe(key.toLowerCase());
    }
  });
});

describe("RuleBasedFallback.generateResponse", () => {
  const fallback = new RuleBasedFallback();

  it("matches a flood question case-insensitively", async () => {
    const res = await fallback.generateResponse("What should I do during a FLOOD?", {});
    expect(res.source).toBe("rule-based");
    expect(res.mode).toBe("local");
    expect(res.confidence).toBe(RuleBasedFallback.MATCH_CONFIDENCE);
    expect(res.text).toContain("highest ground");
  });

  it("matches keyword triggers like 'cyclone safety'", async () => {
    const res = await fallback.generateResponse("cyclone safety tips", {});
    expect(res.text).toContain("Stay indoors");
  });

  it("answers 'nearest shelter' from the cached guidance", async () => {
    const res = await fallback.generateResponse("where is the nearest shelter?", {});
    expect(res.text.toLowerCase()).toContain("resources tab");
  });

  it("returns the low-confidence guided fallback for unknown prompts", async () => {
    const res = await fallback.generateResponse("jabberwocky quantum flux", {});
    expect(res.confidence).toBe(RuleBasedFallback.FALLBACK_CONFIDENCE);
    expect(res.text).toBe(RULE_FALLBACK_RESPONSE);
    expect(res.text).toContain("112");
  });

  it("implements the AIProvider contract", async () => {
    expect(fallback.getStatus()).toBe("local-ready");
    expect(fallback.estimateTokens("hello world")).toBeGreaterThan(0);
    expect(await fallback.loadModel()).toBe(true);
  });
});
