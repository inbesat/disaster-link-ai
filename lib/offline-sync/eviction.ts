// ---------------------------------------------------------------------
// lib/offline-sync/eviction.ts — Offline-First Architecture · Phase 3
// Storage management primitives that keep the browser cache inside the
// 200 MB budget without dropping anything the field responder still needs:
//
//   • purgeExpired()        — auto-delete rows older than a dataset's TTL
//                             (predictions > 48h, stale alerts, etc.). This
//                             is the "data expiry system" deliverable.
//   • evictLruMapTiles()    — keep map tiles only while they fit the 50 MB
//                             tile budget; evict least-recently-used first
//                             (MapTile.lastAccessedAt is bumped on reads).
//   • getCacheBreakdown()   — per-table row counts + byte estimates used by
//                             the Storage Manager category list.
//
// All functions are SSR-safe (return a no-op/empty result when IndexedDB
// is unavailable) and never throw.
// ---------------------------------------------------------------------

import type { DisasterLinkDB } from "./db";
import type { DataType } from "./types";
import { DATA_TYPES } from "./types";
import { configForType } from "./config";
import { STORAGE_BUDGET_BYTES } from "./quota";

/** Map-tile budget from the Phase 3 spec (user's state only). */
export const MAP_TILE_BUDGET_BYTES = 50 * 1024 * 1024; // 50 MB

/** The offline window for predictions/alerts (Phase 2 spec). */
export const DEFAULT_EXPIRY_HOURS = 48;

/** Dataset tables that live under the generic OfflineRecord shape. */
const DATASET_TABLES: DataType[] = [
  "predictions",
  "alerts",
  "routes",
  "resources",
  "weather",
  "profiles",
  "maps",
  "knowledge",
];

export interface CacheBreakdownEntry {
  type: string;
  label: string;
  rowCount: number;
  sizeBytes: number;
}

/**
 * Auto-expiry: deletes every row whose expiresAt is in the past across all
 * dataset tables (respecting each dataset's own TTL, e.g. predictions use
 * the 48h window). Returns the number of rows removed.
 */
export async function purgeExpired(db: DisasterLinkDB | null): Promise<number> {
  if (!db) return 0;
  const now = Date.now();
  let removed = 0;
  for (const type of DATASET_TABLES) {
    try {
      const table = db[type];
      const expired = await table
        .filter((r) => new Date(r.expiresAt).getTime() < now)
        .toArray();
      if (expired.length) {
        await table.bulkDelete(expired.map((r) => r.id));
        removed += expired.length;
      }
    } catch {
      // table missing (first run) — skip
    }
  }
  return removed;
}

/**
 * LRU eviction of map tiles. Order by lastAccessedAt ascending (coldest
 * first) and delete until the tile table fits within `budgetBytes`.
 * Returns the number of tiles deleted.
 */
export async function evictLruMapTiles(
  db: DisasterLinkDB | null,
  budgetBytes: number = MAP_TILE_BUDGET_BYTES,
): Promise<number> {
  if (!db) return 0;
  try {
    const tiles = await db.mapTiles
      .orderBy("lastAccessedAt")
      .toArray();
    let used = tiles.reduce((sum, t) => sum + (t.data?.size ?? 0), 0);
    let deleted = 0;
    for (const tile of tiles) {
      if (used <= budgetBytes) break;
      const size = tile.data?.size ?? 0;
      await db.mapTiles.delete(tile.id);
      used -= size;
      deleted += 1;
    }
    return deleted;
  } catch {
    return 0;
  }
}

/** Bumps lastAccessedAt so a hot tile survives the next LRU pass. */
export async function touchMapTile(
  db: DisasterLinkDB | null,
  id: string,
): Promise<void> {
  if (!db) return;
  try {
    const tile = await db.mapTiles.get(id);
    if (tile) {
      await db.mapTiles.update(id, { lastAccessedAt: new Date().toISOString() });
    }
  } catch {
    // ignore
  }
}

/**
 * Per-table breakdown for the Storage Manager category list. Row count is
 * live; byte size is estimated from the dataset's configured sizeBytes.
 */
export async function getCacheBreakdown(
  db: DisasterLinkDB | null,
): Promise<CacheBreakdownEntry[]> {
  if (!db) return [];
  const entries: CacheBreakdownEntry[] = [];
  for (const type of DATASET_TABLES) {
    const config = configForType(type);
    try {
      const rows = await db[type].count();
      const rowCount = rows ?? 0;
      const avgRowBytes =
        config && config.expectedRows
          ? config.sizeBytes / Math.max(1, config.expectedRows)
          : 0;
      entries.push({
        type,
        label: type,
        rowCount,
        sizeBytes: Math.round(rowCount * avgRowBytes),
      });
    } catch {
      entries.push({ type, label: type, rowCount: 0, sizeBytes: 0 });
    }
  }
  // Model chunks — the biggest single consumer when downloaded.
  try {
    const chunks = await db.gemmaModel.count();
    entries.push({
      type: "model",
      label: "Gemma 2B (4-bit)",
      rowCount: chunks,
      sizeBytes: chunks * 0, // sized separately by the model manifest
    });
  } catch {
    // ignore
  }
  return entries;
}

export { STORAGE_BUDGET_BYTES };
