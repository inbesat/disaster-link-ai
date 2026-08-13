// ---------------------------------------------------------------------
// lib/offline-context/prompts.test.ts — Phase 5 prompt assembly + the
// 2000-token context limiter.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  buildAugmentedPrompt,
  countTokens,
  DISASTER_SYSTEM_PROMPT,
  MAX_CONTEXT_TOKENS,
  truncateContext,
} from "./prompts";

const longContext = "sentence one. ".repeat(3000); // ~22500 tokens

describe("truncateContext", () => {
  it("leaves short context untouched", () => {
    expect(truncateContext("hello world")).toBe("hello world");
  });

  it("truncates context over the 2000-token budget", () => {
    const out = truncateContext(longContext);
    expect(out).toContain("[context truncated to fit the model window]");
    expect(countTokens(out)).toBeLessThan(MAX_CONTEXT_TOKENS * 2);
  });

  it("returns empty string for empty input", () => {
    expect(truncateContext("")).toBe("");
  });
});

describe("countTokens", () => {
  it("estimates ~4 chars per token", () => {
    expect(countTokens("abc")).toBe(1);
    expect(countTokens("")).toBe(0);
  });
});

describe("buildAugmentedPrompt", () => {
  it("wraps system + context + question with an Answer anchor", () => {
    const prompt = buildAugmentedPrompt("Where is the nearest shelter?", "=== NEARBY RESOURCES\nHall A");
    expect(prompt.startsWith(DISASTER_SYSTEM_PROMPT)).toBe(true);
    expect(prompt).toContain("User Question: Where is the nearest shelter?");
    expect(prompt.trimEnd().endsWith("Answer:")).toBe(true);
  });

  it("respects a custom max context tokens", () => {
    const prompt = buildAugmentedPrompt("hi", "x".repeat(400), { maxContextTokens: 10 });
    expect(prompt).toContain("[context truncated to fit the model window]");
  });
});