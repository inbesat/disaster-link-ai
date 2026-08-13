// ---------------------------------------------------------------------
// lib/perf/benchmark.ts — Offline-First Architecture · Phase 10
// Benchmark suite: measures the offline-first performance metrics the
// Benchmark Panel renders, with injectable providers/fetchers so the suite
// runs hermetically in tests and on devices without the model installed.
//
//   const report = await runBenchmarks();
//   // { aiLatencyMs, tokensPerSecond, modelLoadMs, syncMs, storageBytes,
//   //   quotaBytes, cacheHitRate, memoryBytes, timestamp }
//
// Every function is defensive: a missing provider, browser API or model
// yields 0 / null rather than throwing, so the dashboard never crashes on
// a phone that lacks the battery or performance.memory APIs.
// ---------------------------------------------------------------------

import type { AIProvider } from "@/lib/ai-bridge/types";
import { estimateTokens } from "@/lib/ai-bridge/estimate-tokens";
import { checkStorageQuota } from "@/lib/offline-sync/quota";
import { getCacheBreakdown } from "@/lib/offline-sync/eviction";
import { getOfflineDb } from "@/lib/offline-sync/db";
import type { OfflineSyncEngine } from "@/lib/offline-sync/sync-engine";

/** One benchmark measurement fed into the panel + budget enforcement. */
export interface BenchmarkReport {
  timestamp: number;
  /** Local AI response time in ms (target < 3000). */
  aiLatencyMs: number;
  /** Tokens generated per second during the local reply. */
  tokensPerSecond: number;
  /** Model load time in ms (0 = not loaded / no model). */
  modelLoadMs: number;
  /** Last full sync duration in ms (0 = never synced). */
  syncMs: number;
  /** Storage used / available (bytes), 0 when API unsupported. */
  storageBytes: number;
  quotaBytes: number;
  /** Fraction 0..1 of tile/API requests served from cache. */
  cacheHitRate: number;
  /** Heap memory in bytes (performance.memory), 0 when unavailable. */
  memoryBytes: number;
  /** True when the local model was actually exercised. */
  aiTested: boolean;
}

export interface BenchmarkOptions {
  localProvider?: AIProvider | null;
  syncEngine?: Pick<OfflineSyncEngine, "fullSync"> | null;
  dbName?: string;
  /** Overrides the sample prompt used for AI latency. */
  prompt?: string;
  /** Skip the AI latency test (battery saver / model not downloaded). */
  skipAi?: boolean;
}

const SAMPLE_PROMPT =
  "What should I do during a flood? Give me five quick safety steps.";

/** Reads the live cache-hit ratio from the shared hit/miss counters. */
export function currentCacheHitRate(hits: number, misses: number): number {
  const total = hits + misses;
  if (total === 0) return 0;
  return hits / total;
}

/**
 * Measures a single local-model reply: latency + tokens/sec. Uses the
 * provider's own estimateTokens for the output so no tokenizer dependency.
 * Returns 0s when the model isn't ready (dashboards show "n/a").
 */
export async function benchmarkLocalAi(
  provider: AIProvider | null | undefined,
  prompt: string = SAMPLE_PROMPT,
): Promise<{ latencyMs: number; tokensPerSecond: number; ok: boolean }> {
  if (!provider) return { latencyMs: 0, tokensPerSecond: 0, ok: false };
  try {
    const started = Date.now();
    const res = await provider.generateResponse(prompt, {});
    const latencyMs = Date.now() - started;
    if (res.error || !res.text) return { latencyMs, tokensPerSecond: 0, ok: false };
    const tokens = estimateTokens(res.text);
    const seconds = Math.max(latencyMs / 1000, 0.001);
    return { latencyMs, tokensPerSecond: Math.round(tokens / seconds), ok: true };
  } catch {
    return { latencyMs: 0, tokensPerSecond: 0, ok: false };
  }
}

/** Measures model load (0 when already loaded or unavailable). */
export async function benchmarkModelLoad(
  provider: AIProvider | null | undefined,
): Promise<number> {
  if (!provider?.loadModel) return 0;
  try {
    const started = Date.now();
    await provider.loadModel();
    return Date.now() - started;
  } catch {
    return 0;
  }
}

/** Measures one full sync pass; 0 when no engine is available. */
export async function benchmarkSync(
  engine: Pick<OfflineSyncEngine, "fullSync"> | null | undefined,
): Promise<number> {
  if (!engine) return 0;
  try {
    const started = Date.now();
    await engine.fullSync({ force: false });
    return Date.now() - started;
  } catch {
    return 0;
  }
}

/** Storage usage + quota from navigator.storage (0s when unsupported). */
export async function benchmarkStorage(): Promise<{ storageBytes: number; quotaBytes: number }> {
  const snap = await checkStorageQuota();
  return { storageBytes: snap.usageBytes ?? 0, quotaBytes: snap.quotaBytes ?? 0 };
}

/** Heap memory via performance.memory (Chrome-only; 0 elsewhere). */
export function benchmarkMemory(): number {
  if (typeof performance === "undefined") return 0;
  const mem = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
  return mem?.usedJSHeapSize ?? 0;
}

/**
 * Runs the whole benchmark suite. Each metric is optional-safe: a browser
 * without IndexedDB, workers or storage returns zeros for the unsupported
 * readings instead of failing the whole report.
 */
export async function runBenchmarks(options: BenchmarkOptions = {}): Promise<BenchmarkReport> {
  const db = typeof indexedDB === "undefined" ? null : getOfflineDb(options.dbName);
  const cache = await readCacheCounters(db);

  const ai = options.skipAi
    ? { latencyMs: 0, tokensPerSecond: 0, ok: false }
    : await benchmarkLocalAi(options.localProvider, options.prompt);

  const [modelLoadMs, syncMs, storage] = await Promise.all([
    benchmarkModelLoad(options.localProvider),
    benchmarkSync(options.syncEngine ?? null),
    benchmarkStorage(),
  ]);

  return {
    timestamp: Date.now(),
    aiLatencyMs: ai.latencyMs,
    tokensPerSecond: ai.tokensPerSecond,
    modelLoadMs,
    syncMs,
    storageBytes: storage.storageBytes,
    quotaBytes: storage.quotaBytes,
    cacheHitRate: cache.hitRate,
    memoryBytes: benchmarkMemory(),
    aiTested: ai.ok,
  };
}

/** Reads persisted cache hit/miss counters from the metadata table. */
async function readCacheCounters(db: { metadata?: { get(key: string): Promise<{ value: unknown } | undefined> } } | null): Promise<{ hitRate: number }> {
  if (!db?.metadata) return { hitRate: 0 };
  try {
    const [hitsRow, missesRow] = await Promise.all([
      db.metadata.get("perf:cache:hits"),
      db.metadata.get("perf:cache:misses"),
    ]);
    const hits = Number(hitsRow?.value ?? 0);
    const misses = Number(missesRow?.value ?? 0);
    return { hitRate: currentCacheHitRate(hits, misses) };
  } catch {
    return { hitRate: 0 };
  }
}

/** Counts the number of cached rows across all datasets (dashboard helper). */
export async function countCachedRows(dbName?: string): Promise<number> {
  if (typeof indexedDB === "undefined") return 0;
  const db = getOfflineDb(dbName);
  const breakdown = await getCacheBreakdown(db);
  return breakdown.reduce((sum, e) => sum + e.rowCount, 0);
}

export default runBenchmarks;
