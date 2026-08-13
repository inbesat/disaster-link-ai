// ---------------------------------------------------------------------
// lib/perf/budget.test.ts — Phase 10 performance budget enforcement
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  checkPerformanceBudget,
  assertPerformanceBudget,
  budgetPassed,
  PERFORMANCE_BUDGET,
} from "./budget";
import type { BenchmarkReport } from "./benchmark";

function report(overrides: Partial<BenchmarkReport> = {}): BenchmarkReport {
  return {
    timestamp: Date.now(),
    aiLatencyMs: 2200,
    tokensPerSecond: 14,
    modelLoadMs: 12000,
    syncMs: 4200,
    storageBytes: 45 * 1024 * 1024,
    quotaBytes: 200 * 1024 * 1024,
    cacheHitRate: 0.94,
    memoryBytes: 800 * 1024 * 1024,
    aiTested: true,
    ...overrides,
  };
}

describe("checkPerformanceBudget", () => {
  it("passes a report within all spec targets", () => {
    const violations = checkPerformanceBudget(report());
    expect(violations.filter((v) => !v.ok).length).toBe(0);
  });

  it("flags AI latency over 3 s", () => {
    const violations = checkPerformanceBudget(report({ aiLatencyMs: 4200 }));
    const ai = violations.find((v) => v.key === "aiLatencyMs");
    expect(ai?.ok).toBe(false);
    expect(ai?.actual).toBe(4200);
    expect(ai?.budget).toBe(3000);
  });

  it("flags token speed below 12 tps", () => {
    const violations = checkPerformanceBudget(report({ tokensPerSecond: 5 }));
    expect(violations.find((v) => v.key === "minTokensPerSecond")?.ok).toBe(false);
  });

  it("flags storage over the 200 MB budget", () => {
    const violations = checkPerformanceBudget(report({ storageBytes: 220 * 1024 * 1024 }));
    expect(violations.find((v) => v.key === "storageBytes")?.ok).toBe(false);
  });

  it("flags cache hit rate below 90%", () => {
    const violations = checkPerformanceBudget(report({ cacheHitRate: 0.6 }));
    expect(violations.find((v) => v.key === "minCacheHitRate")?.ok).toBe(false);
  });

  it("marks untested metrics as ok so the panel doesn't cry wolf", () => {
    const violations = checkPerformanceBudget(report({ aiTested: false }));
    const ai = violations.find((v) => v.key === "aiLatencyMs");
    expect(ai?.untested).toBe(true);
    expect(ai?.ok).toBe(true);
  });

  it("PERFORMANCE_BUDGET matches the Phase 10 spec numbers", () => {
    expect(PERFORMANCE_BUDGET.aiLatencyMs).toBe(3000);
    expect(PERFORMANCE_BUDGET.minTokensPerSecond).toBe(12);
    expect(PERFORMANCE_BUDGET.modelLoadMs).toBe(15000);
    expect(PERFORMANCE_BUDGET.syncMs).toBe(10000);
    expect(PERFORMANCE_BUDGET.storageBytes).toBe(200 * 1024 * 1024);
    expect(PERFORMANCE_BUDGET.minCacheHitRate).toBe(0.9);
  });
});

describe("budgetPassed / assertPerformanceBudget", () => {
  it("budgetPassed is true for a healthy report", () => {
    expect(budgetPassed(report())).toBe(true);
  });

  it("budgetPassed is false when a tested metric misses", () => {
    expect(budgetPassed(report({ aiLatencyMs: 5000 }))).toBe(false);
  });

  it("assertPerformanceBudget throws on a violation with a readable message", () => {
    expect(() => assertPerformanceBudget(report({ syncMs: 30000 }))).toThrow(/Performance budget exceeded/);
  });

  it("assertPerformanceBudget does not throw for a healthy report", () => {
    expect(() => assertPerformanceBudget(report())).not.toThrow();
  });
});
