// ---------------------------------------------------------------------
// lib/ai/setup/model-tiers.test.ts
// Phase 4 · model decision matrix + tier recommendation logic.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { AI_TIERS, MODEL_CATALOG, modelById, recommendTier, tierById } from "./model-tiers";

describe("MODEL_CATALOG", () => {
  it("ships the three Phase 4 decision-matrix models with sizes", () => {
    expect(MODEL_CATALOG).toHaveLength(3);
    const tiny = MODEL_CATALOG.find((m) => m.family === "tinylama");
    expect(tiny?.sizeBytes).toBeCloseTo(600 * 1024 * 1024, -6);
    const gemma = MODEL_CATALOG.find((m) => m.family === "gemma");
    expect(gemma?.sizeBytes).toBeCloseTo(1.3 * 1024 * 1024 * 1024, -6);
    const phi = MODEL_CATALOG.find((m) => m.family === "phi");
    expect(phi?.sizeBytes).toBeCloseTo(1.6 * 1024 * 1024 * 1024, -6);
  });

  it("modelById finds a catalog entry by its WebLLM id", () => {
    expect(modelById(MODEL_CATALOG[0].modelId)).toBeDefined();
    expect(modelById("nope")).toBeUndefined();
  });
});

describe("AI_TIERS", () => {
  it("offers exactly the three tiers in UI order", () => {
    expect(AI_TIERS.map((t) => t.id)).toEqual([
      "cloud-only",
      "balanced",
      "full-offline",
    ]);
  });

  it("cloud-only has no model; balanced/full-offline reference one", () => {
    const cloud = tierById("cloud-only");
    expect(cloud?.modelId).toBeNull();
    expect(tierById("balanced")?.modelId).toBeTruthy();
    expect(tierById("full-offline")?.modelId).toBeTruthy();
  });
});

describe("recommendTier", () => {
  const caps = (overrides: Record<string, number | string | boolean>) => ({
    gpu: "webgpu",
    wasmSimd: true,
    deviceMemoryGb: 8,
    storageFreeBytes: 2 * 1024 * 1024 * 1024,
    ...overrides,
  }) as Parameters<typeof recommendTier>[0];

  it("recommends full-offline on a WebGPU + 8 GB + big-storage device", () => {
    expect(recommendTier(caps({}))).toBe("full-offline");
  });

  it("recommends balanced when storage can't hold the 1.6 GB Phi model", () => {
    expect(recommendTier(caps({ storageFreeBytes: 800 * 1024 * 1024 }))).toBe("balanced");
  });

  it("recommends cloud-only without GPU or WASM", () => {
    expect(
      recommendTier(caps({ gpu: "none", wasmSimd: false })),
    ).toBe("cloud-only");
  });

  it("recommends balanced on WASM-only devices with storage", () => {
    expect(
      recommendTier(caps({ gpu: "none", wasmSimd: true, storageFreeBytes: 700 * 1024 * 1024 })),
    ).toBe("balanced");
  });
});