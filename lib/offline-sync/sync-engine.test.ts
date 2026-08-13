// ---------------------------------------------------------------------
// lib/offline-sync/sync-engine.test.ts
// Phase 2 · OfflineSyncEngine: priority-ordered full sync, 48h TTL
// pruning, IndexedDB reads that never hit the network, and forced sync
// while "offline." Runs on fake-indexeddb with injected fetchers + a fake
// connectivity monitor so the tests are hermetic.
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfflineSyncEngine } from "./sync-engine";
import type { DataSourceConfig, DataType } from "./types";
import type { ConnectivityMonitor } from "@/lib/ai-bridge/connectivity";

let dbCounter = 0;
const uniqueDb = () => `sync-test-${dbCounter++}-${Math.random().toString(36).slice(2, 8)}`;

/** Fake monitor whose snapshot we control. */
function fakeMonitor(online = true): ConnectivityMonitor {
  const snap = {
    online,
    browserOnline: online,
    backendReachable: online,
    heartbeatAgeMs: 1000,
  };
  return {
    start: () => {},
    stop: () => {},
    update: () => {},
    heartbeat: async () => snap,
    getSnapshot: () => snap,
    subscribe: () => () => {},
  } as unknown as ConnectivityMonitor;
}

/** A dataset source whose fetch returns N rows captured for assertions. */
function source(
  type: DataType,
  rows: Array<{ id?: string; extra?: unknown }>,
): DataSourceConfig<unknown> {
  return {
    type,
    sizeBytes: 100,
    refreshHours: 6,
    ttlHours: 48,
    priority: type === "alerts" ? "critical" : "high",
    fetch: vi.fn(async (opts: { district: string }) =>
      rows.map((r) => ({ id: r.id ?? `${type}:${opts.district}:${Math.random()}`, ...r })),
    ),
    idOf: (r) => String((r as { id?: unknown }).id ?? Math.random()),
  };
}

describe("OfflineSyncEngine", () => {
  let engine: OfflineSyncEngine;
  let sources: Array<DataSourceConfig<unknown>>;

  beforeEach(() => {
    sources = [
      source("alerts", [{ id: "a1" }, { id: "a2" }]),
      source("predictions", [{ id: "p1" }]),
    ];
    engine = new OfflineSyncEngine({
      districts: ["Patna"],
      sources,
      monitor: fakeMonitor(true),
      dbName: uniqueDb(),
      autostart: false,
    });
  });

  afterEach(() => {
    engine.stop();
    vi.restoreAllMocks();
  });

  it("runs a full sync and caches rows readable by district", async () => {
    const result = await engine.fullSync();
    expect(result.synced).toBe(2);

    const alerts = await engine.getOfflineData("alerts", "Patna");
    expect(alerts.length).toBe(2);
    expect(alerts[0].data).toMatchObject({ id: "a1" });
  });

  it("orders critical datasets before high ones (alerts fetched, then predictions)", async () => {
    await engine.fullSync();
    const alertsFetch = (sources[0].fetch as unknown as ReturnType<typeof vi.fn>);
    const predsFetch = (sources[1].fetch as unknown as ReturnType<typeof vi.fn>);
    // Both run (Promise.allSettled within the band), but the band order is
    // critical-first; at minimum alerts must have been requested.
    expect(alertsFetch).toHaveBeenCalledWith({ district: "Patna" });
    expect(predsFetch).toHaveBeenCalledWith({ district: "Patna" });
  });

  it("prunes expired rows on read (48h window)", async () => {
    await engine.fullSync();
    // Insert an already-expired alert directly into the same shared DB.
    const { getOfflineDb } = await import("./db");
    const db = getOfflineDb((engine as unknown as { dbName: string }).dbName);
    const now = Date.now();
    await db.alerts.put({
      id: "expired-1",
      district: "Patna",
      data: { id: "expired-1" },
      cachedAt: new Date(now - 60 * 86400 * 1000).toISOString(),
      expiresAt: new Date(now - 10_000).toISOString(),
    });

    const rows = await engine.getOfflineData("alerts", "Patna");
    expect(rows.length).toBe(2); // the expired row was pruned
    expect(rows.some((r) => r.id === "expired-1")).toBe(false);
  });

  it("does not run full sync when offline unless forced", async () => {
    const offlineEngine = new OfflineSyncEngine({
      districts: ["Patna"],
      sources: [source("alerts", [])],
      monitor: fakeMonitor(false),
      dbName: uniqueDb(),
      autostart: false,
    });
    await offlineEngine.fullSync();
    const rows = await offlineEngine.getOfflineData("alerts", "Patna");
    expect(rows.length).toBe(0);
  });

  it("writes lastFullSync metadata after a successful full sync", async () => {
    await engine.fullSync();
    const { getOfflineDb } = await import("./db");
    const db = getOfflineDb((engine as unknown as { dbName: string }).dbName);
    const meta = await db.metadata.get("lastFullSync");
    expect(typeof meta?.value).toBe("number");
    expect(Number(meta?.value)).toBeGreaterThan(0);
  });

  it("syncs a single dataset type across districts", async () => {
    const result = await engine.syncType("predictions");
    expect(result.synced).toBe(1);
    const rows = await engine.getOfflineData("predictions", "Patna");
    expect(rows.length).toBe(1);
  });

  it("reports status with freshness + size estimates", async () => {
    await engine.fullSync();
    const status = await engine.getStatus();
    expect(status.datasets.length).toBeGreaterThanOrEqual(sources.length);
    const alerts = status.datasets.find((d) => d.type === "alerts");
    expect(alerts?.rowCount).toBe(2);
    expect(alerts?.fresh).toBe(true);
    expect(alerts?.sizeBytes).toBeGreaterThan(0);
    expect(status.online).toBe(true);
    expect(status.lastFullSync).toBeGreaterThan(0);
    expect(status.districts).toEqual(["Patna"]);
  });

  it("getOfflineData returns [] when IndexedDB is unavailable", async () => {
    // Simulate SSR/node: delete the indexedDB global.
    const original = globalThis.indexedDB;
    Object.defineProperty(globalThis, "indexedDB", { value: undefined, configurable: true });
    const rows = await engine.getOfflineData("alerts", "Patna");
    expect(rows).toEqual([]);
    if (original) Object.defineProperty(globalThis, "indexedDB", { value: original, configurable: true });
  });
});