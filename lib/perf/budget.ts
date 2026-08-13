// ---------------------------------------------------------------------
// lib/perf/budget.ts — Offline-First Architecture · Phase 10
// Performance budget enforcement: defines the spec's target thresholds and
// flags any benchmark reading that misses them, so the Benchmark Panel can
// color-code metrics and the dev build can fail/warn on regressions.
//
//   const report = await runBenchmarks();
//   const violations = checkPerformanceBudget(report);
//   // [{ key: "aiLatency", actual: 4200, budget: 3000, label, ok:false }, ...]
//
// Budgets (from the Phase 10 spec):
//   • AI latency   < 3000 ms
//   • Token speed  >= 12 tps
//   • Model load   < 15000 ms
//   • Sync time    < 10000 ms
//   • Storage      <= 200 MB used (the soft budget)
//   • Cache hit    >= 0.9 (90%)
// ---------------------------------------------------------------------

import type { BenchmarkReport } from "./benchmark";

/** All spec budget thresholds, ms/bytes/fractions. */
export interface PerformanceBudget {
  aiLatencyMs: number;
  minTokensPerSecond: number;
  modelLoadMs: number;
  syncMs: number;
  storageBytes: number;
  minCacheHitRate: number;
}

export const PERFORMANCE_BUDGET: PerformanceBudget = {
  aiLatencyMs: 3000,
  minTokensPerSecond: 12,
  modelLoadMs: 15000,
  syncMs: 10000,
  storageBytes: 200 * 1024 * 1024, // 200 MB
  minCacheHitRate: 0.9,
};

export interface BudgetViolation {
  key: keyof PerformanceBudget;
  label: string;
  actual: number;
  budget: number;
  /** False when the metric misses its budget (or could not be measured). */
  ok: boolean;
  /** True when the metric was never measured (no model, no sync). */
  untested?: boolean;
}

/** Evaluates a benchmark report against the spec budget. */
export function checkPerformanceBudget(report: BenchmarkReport): BudgetViolation[] {
  const b = PERFORMANCE_BUDGET;
  const violations: BudgetViolation[] = [];

  if (report.aiTested) {
    violations.push({
      key: "aiLatencyMs",
      label: "AI latency",
      actual: report.aiLatencyMs,
      budget: b.aiLatencyMs,
      ok: report.aiLatencyMs < b.aiLatencyMs,
    });
    violations.push({
      key: "minTokensPerSecond",
      label: "Token speed",
      actual: report.tokensPerSecond,
      budget: b.minTokensPerSecond,
      ok: report.tokensPerSecond >= b.minTokensPerSecond,
    });
  } else {
    violations.push(
      {
        key: "aiLatencyMs",
        label: "AI latency",
        actual: 0,
        budget: b.aiLatencyMs,
        ok: true,
        untested: true,
      },
      {
        key: "minTokensPerSecond",
        label: "Token speed",
        actual: 0,
        budget: b.minTokensPerSecond,
        ok: true,
        untested: true,
      },
    );
  }

  if (report.modelLoadMs > 0) {
    violations.push({
      key: "modelLoadMs",
      label: "Model load",
      actual: report.modelLoadMs,
      budget: b.modelLoadMs,
      ok: report.modelLoadMs < b.modelLoadMs,
    });
  } else {
    violations.push({ key: "modelLoadMs", label: "Model load", actual: 0, budget: b.modelLoadMs, ok: true, untested: true });
  }

  if (report.syncMs > 0) {
    violations.push({
      key: "syncMs",
      label: "Sync time",
      actual: report.syncMs,
      budget: b.syncMs,
      ok: report.syncMs < b.syncMs,
    });
  } else {
    violations.push({ key: "syncMs", label: "Sync time", actual: 0, budget: b.syncMs, ok: true, untested: true });
  }

  if (report.storageBytes > 0) {
    violations.push({
      key: "storageBytes",
      label: "Storage used",
      actual: report.storageBytes,
      budget: b.storageBytes,
      ok: report.storageBytes <= b.storageBytes,
    });
  } else {
    violations.push({ key: "storageBytes", label: "Storage used", actual: 0, budget: b.storageBytes, ok: true, untested: true });
  }

  if (report.cacheHitRate > 0) {
    violations.push({
      key: "minCacheHitRate",
      label: "Cache hit rate",
      actual: report.cacheHitRate,
      budget: b.minCacheHitRate,
      ok: report.cacheHitRate >= b.minCacheHitRate,
    });
  } else {
    violations.push({ key: "minCacheHitRate", label: "Cache hit rate", actual: 0, budget: b.minCacheHitRate, ok: true, untested: true });
  }

  return violations;
}

/** True when every *tested* metric meets its budget. */
export function budgetPassed(report: BenchmarkReport): boolean {
  return checkPerformanceBudget(report).every((v) => v.ok);
}

/**
 * Enforcement for the dev pipeline / CI: throws with a readable summary
 * when a tested metric misses its budget. Used by `npm run bench:check`.
 */
export function assertPerformanceBudget(report: BenchmarkReport): void {
  const failures = checkPerformanceBudget(report).filter((v) => !v.ok && !v.untested);
  if (failures.length === 0) return;
  const detail = failures
    .map((f) => `${f.label}: ${f.actual} (budget ${f.budget})`)
    .join(", ");
  throw new Error(`Performance budget exceeded: ${detail}`);
}

export default checkPerformanceBudget;
