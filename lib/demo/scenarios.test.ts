// ---------------------------------------------------------------------
// lib/demo/scenarios.test.ts — Phase 12 · Demo Mode scenario simulators
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { describe, expect, it, vi } from "vitest";
import {
  clearAllCache,
  corruptModel,
  DEMO_MODE_KEY,
  isDemoModeEnabled,
  isOfflineSimulated,
  resetToFirstTimeUser,
  restoreBattery,
  restoreNetwork,
  setDemoModeEnabled,
  simulateLowBattery,
  simulateOffline,
  type CacheStorageLike,
  type StorageLike,
} from "./scenarios";
import { ConnectivityMonitor } from "@/lib/ai-bridge/connectivity";
import { createBatteryGate } from "@/lib/perf/battery-gate";
import { getOfflineDb } from "@/lib/offline-sync/db";

let counter = 0;
const uniqueDb = () => `demo-scenarios-${counter++}-${Math.random().toString(36).slice(2, 8)}`;

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? (map.get(key) as string) : null),
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
    key: (index) => Array.from(map.keys())[index] ?? null,
    length: map.size,
  };
}

function memoryCache(names: string[] = ["dl-static-v1", "dl-pages-v2"]): CacheStorageLike {
  const set = new Set(names);
  return {
    keys: async () => Array.from(set),
    delete: async (name) => set.delete(name),
  };
}

describe("Demo Mode flag", () => {
  it("defaults to off and persists the toggle", () => {
    const storage = memoryStorage();
    expect(isDemoModeEnabled(storage)).toBe(false);
    setDemoModeEnabled(true, storage);
    expect(isDemoModeEnabled(storage)).toBe(true);
    expect(storage.getItem(DEMO_MODE_KEY)).toBe("1");
    setDemoModeEnabled(false, storage);
    expect(isDemoModeEnabled(storage)).toBe(false);
    expect(storage.getItem(DEMO_MODE_KEY)).toBeNull();
  });

  it("tolerates a null storage", () => {
    expect(isDemoModeEnabled(null)).toBe(false);
    setDemoModeEnabled(true, null);
    expect(isDemoModeEnabled(null)).toBe(false);
  });
});

describe("Simulate Offline", () => {
  it("forces the monitor offline and back", () => {
    vi.stubGlobal("navigator", { onLine: true });
    const monitor = new ConnectivityMonitor(() => Promise.resolve(true));
    const seen: boolean[] = [];
    monitor.subscribe((s) => seen.push(s.browserOnline));

    simulateOffline(monitor);
    expect(monitor.getSimulatedNetwork()).toBe(false);
    expect(monitor.getSnapshot().browserOnline).toBe(false);
    expect(monitor.getSnapshot().online).toBe(false);
    expect(isOfflineSimulated(monitor)).toBe(true);

    restoreNetwork(monitor);
    expect(monitor.getSimulatedNetwork()).toBeNull();
    expect(monitor.getSnapshot().browserOnline).toBe(true);
    expect(isOfflineSimulated(monitor)).toBe(false);

    expect(seen).toContain(false);
    expect(seen.at(-1)).toBe(true);
  });
});

describe("Simulate Low Battery", () => {
  it("pauses sync below 15% and restores after", () => {
    const gate = createBatteryGate();
    expect(gate.shouldPauseSync()).toBe(false);

    simulateLowBattery();
    expect(gate.getState().level).toBe(0.15);
    expect(gate.getState().supported).toBe(true);
    expect(gate.shouldPauseSync()).toBe(true);

    restoreBattery();
    expect(gate.shouldPauseSync()).toBe(false);
  });
});

describe("clearAllCache", () => {
  it("wipes IDB data, cache storage and drip keys (keeps demo flag)", async () => {
    const db = getOfflineDb(uniqueDb());
    await db.predictions.put({
      id: "p1",
      district: "Patna",
      data: { risk: "extreme" },
      cachedAt: "2026-08-13T00:00:00.000Z",
      expiresAt: "2026-08-15T00:00:00.000Z",
    });
    await db.metadata.put({ key: "lastFullSync", value: "2026-08-13T00:00:00.000Z" });
    await db.metadata.put({ key: "model:manifest", value: "manifest" });
    await db.gemmaModel.put({ id: 0, chunkIndex: 0, totalChunks: 2, bytes: new Blob(["a"]), downloadedAt: "t" });

    const cache = memoryCache(["dl-static-v1", "dl-pages-v2"]);
    const storage = memoryStorage({
      "drip:sync-log": "[]",
      "drip:demo-analytics": "[]",
      "drip_ai_tier_v1": "full",
      [DEMO_MODE_KEY]: "1",
      "other:key": "keep-me",
    });

    const { cleared } = await clearAllCache({ db, cacheStorage: cache, storage });

    expect(await db.predictions.count()).toBe(0);
    expect(await db.metadata.count()).toBe(0);
    expect(await db.gemmaModel.count()).toBe(0);
    expect(await cache.keys()).toEqual([]);
    expect(storage.getItem(DEMO_MODE_KEY)).toBe("1");
    expect(storage.getItem("other:key")).toBe("keep-me");
    expect(storage.getItem("drip:sync-log")).toBeNull();
    expect(storage.getItem("drip_ai_tier_v1")).toBeNull();
    expect(cleared).toBeGreaterThanOrEqual(7);
  });
});

describe("corruptModel", () => {
  it("deletes half the chunks and marks the manifest downloading", async () => {
    const db = getOfflineDb(uniqueDb());
    for (let i = 0; i < 6; i += 1) {
      await db.gemmaModel.put({
        id: i,
        chunkIndex: i,
        totalChunks: 6,
        bytes: new Blob([String(i)]),
        downloadedAt: "t",
      });
    }
    await db.metadata.put({
      key: "model:manifest",
      value: { modelId: "gemma-2b-it", status: "complete" } as unknown as string,
    });

    const { deleted } = await corruptModel({ db });

    expect(deleted).toBe(3);
    expect(await db.gemmaModel.count()).toBe(3);
    const manifest = await db.metadata.get("model:manifest");
    expect((manifest?.value as unknown as { status: string }).status).toBe("downloading");
  });

  it("returns 0 when no model is stored", async () => {
    const db = getOfflineDb(uniqueDb());
    expect(await corruptModel({ db })).toEqual({ deleted: 0 });
  });
});

describe("resetToFirstTimeUser", () => {
  it("clears caches, keeps demo mode, navigates to onboarding", async () => {
    const db = getOfflineDb(uniqueDb());
    await db.alerts.put({
      id: "a1",
      district: "Gaya",
      data: { severity: "high" },
      cachedAt: "2026-08-13T00:00:00.000Z",
      expiresAt: "2026-08-15T00:00:00.000Z",
    });
    const cache = memoryCache(["dl-pages-v2"]);
    const storage = memoryStorage({
      "drip:sync-log": "[]",
      "drip_ai_tier_v1": "full",
      [DEMO_MODE_KEY]: "1",
    });
    const navigate = vi.fn();

    await resetToFirstTimeUser({ db, cacheStorage: cache, storage, navigate });

    expect(await db.alerts.count()).toBe(0);
    expect(await cache.keys()).toEqual([]);
    expect(storage.getItem("drip_ai_tier_v1")).toBeNull();
    expect(isDemoModeEnabled(storage)).toBe(true);
    expect(navigate).toHaveBeenCalledWith("/public/onboarding");
  });
});
