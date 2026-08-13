// ---------------------------------------------------------------------
// lib/ai-bridge/confidence.test.ts — Phase 9 confidence scoring
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  scoreResponseConfidence,
  isLowConfidence,
  guardLocalResponse,
  LOW_CONFIDENCE_THRESHOLD,
  LOW_CONFIDENCE_REPLY,
} from "./confidence";

describe("scoreResponseConfidence", () => {
  it("gives a low score to empty or degenerate output", () => {
    expect(scoreResponseConfidence("")).toBe(0);
    expect(scoreResponseConfidence("la la la la la la la la la la")).toBeLessThan(
      LOW_CONFIDENCE_THRESHOLD,
    );
  });

  it("gives a low score to hedging / boilerplate responses", () => {
    const hedged =
      "I'm not sure about that. As an AI I cannot provide that information, sorry.";
    expect(scoreResponseConfidence(hedged)).toBeLessThan(LOW_CONFIDENCE_THRESHOLD);
  });

  it("gives a high score to concrete, actionable advice", () => {
    const good =
      "Call the helpline 112. Move to high ground immediately, evacuate to the nearest shelter and keep your emergency kit and radio ready. Do not walk through floodwater.";
    expect(scoreResponseConfidence(good)).toBeGreaterThanOrEqual(LOW_CONFIDENCE_THRESHOLD);
  });

  it("returns scores clamped to [0, 1]", () => {
    for (const s of ["", "x", "call 112 now", "step by step guide with many words and details"]) {
      const score = scoreResponseConfidence(s);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

describe("isLowConfidence / guardLocalResponse", () => {
  it("flags scores below the 0.6 spec threshold", () => {
    expect(isLowConfidence(0.59)).toBe(true);
    expect(isLowConfidence(0.61)).toBe(false);
    expect(LOW_CONFIDENCE_THRESHOLD).toBe(0.6);
  });

  it("replaces low-confidence text with the guided reply", () => {
    const result = guardLocalResponse("sorry i don't know", 0.1);
    expect(result.text).toBe(LOW_CONFIDENCE_REPLY);
    expect(result.text).toContain("general safety advice");
  });

  it("passes high-confidence text through unchanged", () => {
    const good = "call 112 and evacuate to high ground now";
    const result = guardLocalResponse(good, 0.9);
    expect(result.text).toBe(good);
  });
});
