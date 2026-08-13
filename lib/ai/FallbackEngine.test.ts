// lib/ai/FallbackEngine.test.ts — the zero-MB offline logic engine.

import { describe, expect, it } from "vitest";
import {
  FALLBACK_DEFAULT_RESPONSE,
  generateFallbackResponse,
  sheltersFromContext,
} from "@/lib/ai/FallbackEngine";
import { RULE_RESPONSES } from "@/lib/ai-bridge/rule-based-fallback";

describe("sheltersFromContext", () => {
  it("returns [] for null / strings / undefined", () => {
    expect(sheltersFromContext(null)).toEqual([]);
    expect(sheltersFromContext(undefined)).toEqual([]);
    expect(sheltersFromContext("some summary string")).toEqual([]);
  });

  it("unwraps OfflineRecord rows and sorts by distance ascending", () => {
    const rows = [
      { district: "Patna", data: { name: "Far Shelter", distance: 4.5, capacity: 100, occupancy: 60 } },
      { district: "Patna", data: { name: "Near Shelter", distance: 0.8, capacity: 50, occupancy: 48 } },
      { district: "Patna", data: { name: "No Distance" } },
    ];
    const result = sheltersFromContext(rows);
    expect(result.map((s) => s.name)).toEqual(["Near Shelter", "Far Shelter", "No Distance"]);
  });

  it("accepts a bare array of shelter objects", () => {
    const result = sheltersFromContext([{ name: "Govt School", distance: 2 }]);
    expect(result[0].name).toBe("Govt School");
  });
});

describe("generateFallbackResponse", () => {
  it("answers flood queries from the rule set", () => {
    const rule = RULE_RESPONSES.find((r) => r.keys.includes("flood"))!;
    expect(generateFallbackResponse("what should I do during a flood?")).toBe(rule.response);
  });

  it("answers go-bag queries with the survival kit", () => {
    const rule = RULE_RESPONSES.find((r) => r.keys.includes("go bag"))!;
    const out = generateFallbackResponse("what should I pack in my go bag");
    expect(out).toBe(rule.response);
    expect(out.length).toBeGreaterThan(50);
  });

  it("answers nearest-shelter from real cached rows when context is given", () => {
    const rows = [
      { data: { name: "Patna City High School", address: "Bailey Road", distance: 1.2, capacity: 300, occupancy: 210 } },
    ];
    const out = generateFallbackResponse("where is the nearest shelter?", rows);
    expect(out).toContain("Patna City High School");
    expect(out).toContain("90 safe berths remaining");
  });

  it("falls back to the static shelter rule when no context rows exist", () => {
    const rule = RULE_RESPONSES.find((r) => r.keys.includes("nearest shelter"))!;
    expect(generateFallbackResponse("shelter near me")).toBe(rule.response);
  });

  it("routes evacuation-style prompts to the shelter branch with context", () => {
    const rows = [{ data: { name: "Old City Shelter" } }];
    const out = generateFallbackResponse("where do i go", rows);
    expect(out).toContain("Old City Shelter");
  });

  it("returns the safe default verbatim when nothing matches", () => {
    expect(generateFallbackResponse("please explain string theory")).toBe(FALLBACK_DEFAULT_RESPONSE);
    expect(FALLBACK_DEFAULT_RESPONSE).toContain("low-power offline mode");
  });

  it("never throws on empty input", () => {
    expect(() => generateFallbackResponse("")).not.toThrow();
  });
});