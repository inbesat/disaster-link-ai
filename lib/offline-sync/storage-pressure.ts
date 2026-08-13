// ---------------------------------------------------------------------
// lib/offline-sync/storage-pressure.ts — Offline-First Architecture · Phase 9
// Storage pressure handler: detects when the browser cache is getting too
// full and offers the user concrete, one-tap ways to free space instead of
// letting the model download (or a background sync) fail with a QuotaExceeded
// error.
//
//   const pressure = await evaluateStoragePressure(snapshot);
//   if (pressure.level === "critical") {
//     const actions = await listFreeUpActions(db);
//     // render actions; on click run action.run() → returns bytes freed
//   }
//
// Two thresholds split the warning states:
//   • "warning"  — over 80% of quota used → prompt to free space proactively.
//   • "critical" — less than one free model-chunk block → block new writes.
// ---------------------------------------------------------------------

import type { DisasterLinkDB } from "./db";
import { getCacheBreakdown, evictLruMapTiles } from "./eviction";
import type { StorageSnapshot } from "./types";

/** Fraction of quota that triggers the "warning" state. */
export const PRESSURE_WARNING_FRACTION = 0.8;

/** Minimum free bytes to consider "safe" for new writes. */
export const PRESSURE_SAFE_FREE_BYTES = 16 * 1024 * 1024; // 16 MB

export type StoragePressureLevel = "ok" | "warning" | "critical";

export interface StoragePressure {
  level: StoragePressureLevel;
  /** 0..1 fraction of the browser quota already used. */
  usageFraction: number;
  /** Bytes still free under the quota (0 when unknown). */
  freeBytes: number;
  /** True when the user has granted persistent storage. */
  persisted: boolean;
  /** Human explanation shown to the user. */
  message: string;
}

/**
 * Classifies the current storage snapshot. Never throws — an unsupported or
 * errored snapshot resolves to "ok" (nothing to report).
 */
export async function evaluateStoragePressure(
  snapshot: StorageSnapshot,
): Promise<StoragePressure> {
  if (!snapshot.supported || snapshot.quotaBytes <= 0) {
    return {
      level: "ok",
      usageFraction: 0,
      freeBytes: 0,
      persisted: false,
      message: "Storage API unavailable on this browser.",
    };
  }
  const usageFraction = snapshot.usageBytes / snapshot.quotaBytes;
  const freeBytes = Math.max(0, snapshot.quotaBytes - snapshot.usageBytes);

  let level: StoragePressureLevel = "ok";
  let message = "Storage looks healthy.";
  if (usageFraction >= PRESSURE_WARNING_FRACTION && freeBytes > PRESSURE_SAFE_FREE_BYTES) {
    level = "warning";
    message =
      "The device cache is nearly full. Free some space so background syncs and the local AI model keep working.";
  } else if (freeBytes <= PRESSURE_SAFE_FREE_BYTES) {
    level = "critical";
    message =
      "Device storage is critically low. New data cannot be cached until you free space.";
  }
  return { level, usageFraction, freeBytes, persisted: snapshot.persisted, message };
}

/** A concrete one-tap action the user can take to free storage. */
export interface FreeUpAction {
  /** Stable id used as the button key / telemetry label. */
  id: "clear-tiles" | "reduce-history" | "clear-expired";
  label: string;
  description: string;
  /** Estimated bytes this action can free (0 when unknown). */
  estimateBytes: number;
  /** Performs the action and returns the actual bytes freed. */
  run: () => Promise<number>;
}

/**
 * Lists the free-space actions available given the current cache, each with
 * a byte estimate so the UI can show "Clearing map tiles frees ~42 MB".
 * Actions never throw and degrade gracefully without IndexedDB.
 */
export async function listFreeUpActions(db: DisasterLinkDB | null): Promise<FreeUpAction[]> {
  if (!db) return [];
  const actions: FreeUpAction[] = [];
  try {
    const breakdown = await getCacheBreakdown(db);
    const tiles = breakdown.find((e) => e.type === "maps");
    const tileBytes = tiles?.sizeBytes ?? 0;
    actions.push({
      id: "clear-tiles",
      label: "Clear cached map tiles",
      description: "Remove downloaded offline map tiles (~50 MB when full).",
      estimateBytes: tileBytes,
      run: async () => {
        const freed = await evictLruMapTiles(db, 0);
        return freed;
      },
    });
  } catch {
    // tiles table missing — skip this action
  }
  try {
    const historyCount = await db.chatHistory.count();
    actions.push({
      id: "reduce-history",
      label: "Reduce chat history",
      description: `Delete the oldest chat turns (${historyCount} stored).`,
      estimateBytes: historyCount * 512,
      run: async () => {
        const rows = await db.chatHistory.orderBy("timestamp").toArray();
        const keep = Math.floor(rows.length / 2);
        const drop = rows.slice(0, rows.length - keep);
        if (drop.length) await db.chatHistory.bulkDelete(drop.map((r) => r.id));
        return drop.length * 512;
      },
    });
  } catch {
    // history table missing
  }
  return actions;
}

export default evaluateStoragePressure;
