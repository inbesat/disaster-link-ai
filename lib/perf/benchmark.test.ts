// ---------------------------------------------------------------------
// lib/perf/benchmark.test.ts — Phase 10 benchmark suite
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import {
  benchmarkLocalAi,
  benchmarkModelLoad,
  benchmarkSync,
  benchmarkMemory,
  currentCacheHitRate,
  runBenchmarks,
} from "./benchmark";
import type { AIProvider, AIResponse } from "@/lib/ai-bridge/types";

function fakeProvider(overrides: {
  delayMs?: number;
  text?: string;
  mode?: AIResponse["mode"];
  error?: boolean;
  loadDelayMs?: number;
  loadResult?: boolean;
}): AIProvider {
  const delay = overrides.delayMs ?? 2300;
  const text = overrides.text ?? "Move to high ground. Call 112. Evacuate now.";
  return {
    getStatus: () => "local-ready",
    estimateTokens: (t) => Math.ceil(t.length / 4),
    loadModel: vi.fn(async () => {
      const loadDelay = overrides.loadDelayMs ?? 15000;
      await new Promise((r) => setTimeout(r, Math.min(loadDelay, 5)));
      return overrides.loadResult ?? true;
    }),
    generateResponse: vi.fn(async (): Promise<AIResponse> => {
      await new Promise((r) => setTimeout(r, Math.min(delay, 5)));
      return { text, mode: overrides.mode ?? "local", durationMs: delay, error: overrides.error };
    }),
  };
}

describe("benchmarkLocalAi", () => {
  it("reports latency and tokens-per-second for a ready model", async () => {
    const provider = fakeProvider({ delayMs: 1000, text: "Call 112 and move to high ground now." });
    const result = await benchmarkLocalAi(provider);
    expect(result.ok).toBe(true);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.tokensPerSecond).toBeGreaterThan(0);
  });

  it("returns zeros (ok:false) when no provider is available", async () => {
    expect(await benchmarkLocalAi(null)).toEqual({ latencyMs: 0, tokensPerSecond: 0, ok: false });
  });

  it("returns ok:false when the model errors", async () => {
    const provider = fakeProvider({ error: true, mode: "error" });
    const result = await benchmarkLocalAi(provider);
    expect(result.ok).toBe(false);
  });
});

describe("benchmarkModelLoad / benchmarkSync", () => {
  it("measures load time through the provider's loadModel", async () => {
    const provider = fakeProvider({ loadDelayMs: 100 });
    const ms = await benchmarkModelLoad(provider);
    expect(ms).toBeGreaterThan(0);
  });

  it("returns 0 when the provider has no loadModel", async () => {
    const provider = fakeProvider({});
    delete (provider as { loadModel?: unknown }).loadModel;
    expect(await benchmarkModelLoad(provider)).toBe(0);
  });

  it("measures a full sync pass", async () => {
    const engine = { fullSync: vi.fn(async () => ({ synced: 3, failed: 0 })) };
    const ms = await benchmarkSync(engine as never);
    expect(ms).toBeGreaterThanOrEqual(0);
    expect(engine.fullSync).toHaveBeenCalled();
  });

  it("returns 0 when no engine is available", async () => {
    expect(await benchmarkSync(null)).toBe(0);
  });
});

describe("currentCacheHitRate / benchmarkMemory", () => {
  it("computes the hit fraction", () => {
    expect(currentCacheHitRate(94, 6)).toBeCloseTo(0.94);
    expect(currentCacheHitRate(0, 0)).toBe(0);
  });

  it("reads heap memory defensively (0 when unavailable)", () => {
    const original = (performance as unknown as { memory?: unknown }).memory;
    (performance as unknown as { memory?: unknown }).memory = undefined;
    expect(benchmarkMemory()).toBe(0);
    (performance as unknown as { memory?: unknown }).memory = original;
  });
});

describe("runBenchmarks", () => {
  it("produces a full report without throwing", async () => {
    const report = await runBenchmarks({ localProvider: fakeProvider({ delayMs: 2 }) });
    expect(report.timestamp).toBeGreaterThan(0);
    expect(report.aiTested).toBe(true);
    expect(report.cacheHitRate).toBeGreaterThanOrEqual(0);
    expect(report.memoryBytes).toBeGreaterThanOrEqual(0);
  });

  it("skips the AI test when skipAi is set", async () => {
    const report = await runBenchmarks({ localProvider: fakeProvider({}), skipAi: true });
    expect(report.aiTested).toBe(false);
    expect(report.aiLatencyMs).toBe(0);
  });
});
