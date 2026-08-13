// ---------------------------------------------------------------------
// lib/demo/scenarios.ts — Phase 12 · Demo Mode scenario simulators
//
// One module behind the five "Demo Controls" actions shown during the
// live pitch, so each button maps to a single, testable entry point:
//
//   • Simulate Offline          → force the connectivity monitor offline
//   • Simulate Low Battery      → force the battery gate to 15% (pauses sync)
//   • Clear All Cache           → wipe IDB data + Cache Storage + drip keys
//   • Corrupt Model             → delete half the model chunks (re-download)
//   • Reset to First-Time User  → clear flags/caches and head to onboarding
//
// Every function is SSR-safe and accepts injected deps so the unit tests
// run headless (fake-indexeddb + a mock Storage/CacheStorage).
// ---------------------------------------------------------------------

import type { DisasterLinkDB } from "@/lib/offline-sync/db";
import { getOfflineDb } from "@/lib/offline-sync/db";
import { MODEL_EVENT_STATE } from "@/lib/offline-sync/model-store";
import { setSimulatedBattery } from "@/lib/perf/battery-gate";
import { getConnectivityMonitor, type ConnectivityMonitor } from "@/lib/ai-bridge/connectivity";

/** localStorage flag backing the settings "Demo Mode" toggle. */
export const DEMO_MODE_KEY = "drip:demo-mode";

/** Manifest key the model store keeps in the metadata table. */
const MODEL_MANIFEST_KEY = "model:manifest";

/** Table rows in the offline database whose data is all cache. */
const DATA_TABLES = [
  "predictions",
  "alerts",
  "routes",
  "resources",
  "weather",
  "profiles",
  "maps",
  "knowledge",
  "shelters",
] as const;

/** Onboarding / identity cookies cleared by "Reset to First-Time User". */
const FIRST_TIME_COOKIES = ["role", "demo_mode", "citizen_phone"];

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  length: number;
}

export interface CacheStorageLike {
  keys(): Promise<string[]>;
  delete(name: string): Promise<boolean>;
}

export interface ScenarioDeps {
  db?: DisasterLinkDB | null;
  storage?: StorageLike | null;
  cacheStorage?: CacheStorageLike | null;
  navigate?: (path: string) => void;
}

function defaultDb(): DisasterLinkDB | null {
  if (typeof indexedDB === "undefined") return null;
  return getOfflineDb();
}

function defaultStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function defaultCacheStorage(): CacheStorageLike | null {
  if (typeof caches === "undefined") return null;
  return caches;
}

// --- Demo Mode flag ----------------------------------------------------

/** Whether the floating Demo Controls panel is enabled (SSR-safe). */
export function isDemoModeEnabled(storage: StorageLike | null = defaultStorage()): boolean {
  try {
    return storage?.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist the Demo Mode toggle from settings. */
export function setDemoModeEnabled(enabled: boolean, storage: StorageLike | null = defaultStorage()): void {
  try {
    if (!storage) return;
    if (enabled) storage.setItem(DEMO_MODE_KEY, "1");
    else storage.removeItem(DEMO_MODE_KEY);
  } catch {
    // Storage unavailable — the panel just stays off.
  }
}

// --- Network -----------------------------------------------------------

/** Force the whole app offline (connectivity monitor override). */
export function simulateOffline(monitor: ConnectivityMonitor = getConnectivityMonitor()): void {
  monitor.setSimulatedNetwork(false);
}

/** Restore real network detection after a simulated outage. */
export function restoreNetwork(monitor: ConnectivityMonitor = getConnectivityMonitor()): void {
  monitor.setSimulatedNetwork(null);
}

/** True while the offline scenario is active. */
export function isOfflineSimulated(monitor: ConnectivityMonitor = getConnectivityMonitor()): boolean {
  return monitor.getSimulatedNetwork() === false;
}

// --- Battery -----------------------------------------------------------

/** Force the battery gate to 15% and not charging (sync pauses). */
export function simulateLowBattery(): void {
  setSimulatedBattery(0.15, false);
}

/** Restore the real battery API after the low-battery scenario. */
export function restoreBattery(): void {
  setSimulatedBattery(null);
}

// --- Cache -------------------------------------------------------------

/**
 * Clears every locally cached byte: the offline IDB tables (data + model +
 * chat + tiles), the Cache Storage, and the "drip:*" localStorage keys
 * (sync log, analytics, AI tier). The Demo Mode flag is preserved so the
 * panel stays up after the wipe.
 */
export async function clearAllCache(deps: ScenarioDeps = {}): Promise<{ cleared: number }> {
  const db = deps.db ?? defaultDb();
  const storage = deps.storage ?? defaultStorage();
  const cacheStorage = deps.cacheStorage ?? defaultCacheStorage();
  let cleared = 0;

  if (db) {
    const names: (string | (typeof DATA_TABLES)[number])[] = [
      ...DATA_TABLES,
      "metadata",
      "chatHistory",
      "mapTiles",
      "gemmaModel",
    ];
    for (const name of names) {
      try {
        await db.table(name).clear();
        cleared += 1;
      } catch {
        // Table may not exist in this version — ignore and continue.
      }
    }
  }

  if (cacheStorage) {
    try {
      const names = await cacheStorage.keys();
      for (const name of names) {
        try {
          if (await cacheStorage.delete(name)) cleared += 1;
        } catch {
          // Cache entry already gone.
        }
      }
    } catch {
      // Cache Storage unavailable.
    }
  }

  if (storage) {
    try {
      const doomed: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key === null) continue;
        const isDripPrefixed = key.startsWith("drip:") || key.startsWith("drip_");
        if (isDripPrefixed && key !== DEMO_MODE_KEY) doomed.push(key);
      }
      for (const key of doomed) storage.removeItem(key);
      cleared += doomed.length;
    } catch {
      // Storage unavailable.
    }
  }

  return { cleared };
}

// --- Model -------------------------------------------------------------

/**
 * Corrupts the locally stored model by deleting half its chunks and flipping
 * the manifest back to "downloading", so the integrity check (verifyChunkHashes)
 * detects the gap and re-downloads the missing chunks on the next pass.
 */
export async function corruptModel(deps: ScenarioDeps = {}): Promise<{ deleted: number }> {
  const db = deps.db ?? defaultDb();
  if (!db) return { deleted: 0 };

  const ids = (await db.gemmaModel.orderBy("chunkIndex").primaryKeys()) as number[];
  if (ids.length === 0) return { deleted: 0 };

  const toDelete = ids.filter((_, index) => index % 2 === 0);
  await db.gemmaModel.bulkDelete(toDelete);

  const manifest = await db.metadata.get(MODEL_MANIFEST_KEY);
  const record = manifest?.value as { modelId?: string; status?: string } | null | undefined;
  if (record && typeof record === "object" && record.modelId) {
    await db.metadata.put({
      key: MODEL_MANIFEST_KEY,
      value: {
        ...record,
        status: "downloading",
        updatedAt: new Date().toISOString(),
      } as unknown as string,
    });
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(MODEL_EVENT_STATE, { detail: { status: "downloading" } }),
    );
  }

  return { deleted: toDelete.length };
}

// --- First-time reset --------------------------------------------------

/**
 * Resets the app to a first-time experience: clears all caches + onboarding
 * flags, keeps Demo Mode on, and routes to the onboarding flow so the
 * presenter can replay the "new user" journey.
 */
export async function resetToFirstTimeUser(deps: ScenarioDeps = {}): Promise<void> {
  await clearAllCache(deps);

  // Keep the Demo Controls panel alive through the reset.
  setDemoModeEnabled(true, deps.storage ?? defaultStorage());

  if (typeof document !== "undefined") {
    for (const name of FIRST_TIME_COOKIES) {
      document.cookie = `${name}=; Max-Age=0; path=/`;
    }
  }

  if (deps.navigate) {
    deps.navigate("/public/onboarding");
  } else if (typeof window !== "undefined") {
    window.location.href = "/public/onboarding";
  }
}