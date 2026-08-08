import { describe, expect, it } from "vitest";
import { buildResponsePreview } from "./ai-response-preview";

// ---------------------------------------------------------------------
// lib/settings/ai-response-preview.test.ts — AI Assistant (Phase 4 · Step 3).
//
// Deterministic checks for the verbosity × personality preview matrix.
// ---------------------------------------------------------------------

describe("buildResponsePreview", () => {
  it("returns the exact urgent + concise one-liner", () => {
    expect(buildResponsePreview("concise", "urgent")).toEqual([
      "🚨 FLASH FLOOD. Evacuate Sector 4. Route: Highway 9.",
    ]);
  });

  it("output grows from concise → detailed", () => {
    const concise = buildResponsePreview("concise", "professional");
    const balanced = buildResponsePreview("balanced", "professional");
    const detailed = buildResponsePreview("detailed", "professional");
    expect(concise.length).toBeLessThan(balanced.length);
    expect(balanced.length).toBeLessThan(detailed.length);
  });

  it("shifts tone per personality", () => {
    const urgent = buildResponsePreview("concise", "urgent")[0];
    const formal = buildResponsePreview("concise", "professional")[0];
    expect(urgent).toMatch(/🚨/);
    expect(formal).not.toMatch(/🚨/);
  });
});