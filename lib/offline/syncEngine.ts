"use client";

// ---------------------------------------------------------------------
// lib/offline/syncEngine.ts — Offline-First · 48-hour data cache
//
// syncOfflineData(district): convenience entry point that refreshes the
// 48-hour offline cache for one district through the real sync engine
// (lib/offline-sync/sync-engine.ts). It mocks nothing of its own — the
// engine's per-dataset fetchers hit the app's own /api endpoints and
// fail open to empty arrays, so this never throws (offline or upstream
// down simply counts as `failed`).
//
// Every saved row is upserted (bulkPut — overwrite by id) into the
// shared DisasterLinkDB IndexedDB tables (predictions, alerts, shelters,
// resources, …) and carries the engine's cachedAt/expiresAt pair, which
// stamps the record with its sync time and the 48h expiry window.
// ---------------------------------------------------------------------

import { getSyncEngine, OFFLINE_WINDOW_HOURS } from "@/lib/offline-sync/sync-engine";
import type { DataType } from "@/lib/offline-sync/types";

/** The four core datasets the offline AI needs per district. */
export const OFFLINE_DATASETS: readonly DataType[] = [
  "predictions",
  "alerts",
  "shelters",
  "resources",
];

export interface SyncOfflineResult {
  /** District the sync targeted. */
  district: string;
  /** ISO timestamp when the sync finished (the records' syncedAt). */
  syncedAt: string;
  /** Datasets that saved/overwrote successfully. */
  synced: number;
  /** Datasets that failed (offline / endpoint down — never throws). */
  failed: number;
  /** Freshness window for the cached rows (48 hours). */
  ttlHours: number;
}

/**
 * Pulls the latest disaster data for a district into IndexedDB so the
 * AI keeps working through a comms blackout. Idempotent and safe to call
 * repeatedly — rows are overwritten by id and expired rows pruned.
 */
export async function syncOfflineData(district: string): Promise<SyncOfflineResult> {
  const engine = getSyncEngine();
  const { synced, failed } = await engine.syncDistrict(district);
  return {
    district,
    syncedAt: new Date().toISOString(),
    synced,
    failed,
    ttlHours: OFFLINE_WINDOW_HOURS,
  };
}
