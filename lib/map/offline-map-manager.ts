"use client";

// ---------------------------------------------------------------------
// lib/map/offline-map-manager.ts — Offline-First Architecture · Phase 8
// OfflineMapManager: caches raster map tiles into the `mapTiles` table
// (Phase 3 schema) and serves them back without any network access.
//
//   const manager = new OfflineMapManager();
//   await manager.cacheRegion(bounds, [10, 11, 12], { onProgress });
//   const blob = await manager.getTile(11, 1682, 1160);  // null when cold
//
// Tiles are valid for 7 days (the spec's expiry window); expired tiles are
// deleted on read. A fetch function + db instance are injectable so tests
// and the MapLibre protocol share the same code path hermetically.
//
// `getTile` bumps lastAccessedAt so the Phase 3 LRU evictor keeps the
// tiles that are actually being viewed.
// ---------------------------------------------------------------------

import { getOfflineDb } from "@/lib/offline-sync/db";
import type { DisasterLinkDB } from "@/lib/offline-sync/db";
import { getTileCoordinates, tileId, type LatLngBoundsLike } from "./tile-math";

/** Phase 8 spec — cached tiles are valid for 7 days. */
export const TILE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Default tile source URL template (MapTiler raster, {z}/{x}/{y}). */
export const DEFAULT_TILE_URL_TEMPLATE =
  "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png";

/** Injectables — used by tests and the MapLibre protocol. */
export interface OfflineMapManagerDeps {
  db?: DisasterLinkDB | null;
  fetchTile?: (z: number, x: number, y: number) => Promise<ArrayBuffer>;
  urlTemplate?: string;
}

export interface CacheRegionProgress {
  done: number;
  total: number;
  z: number;
}

export class OfflineMapManager {
  private readonly db: DisasterLinkDB | null;
  private readonly fetchTileFn: (z: number, x: number, y: number) => Promise<ArrayBuffer>;
  private readonly urlTemplate: string;

  constructor(deps: OfflineMapManagerDeps = {}) {
    this.db = deps.db ?? (typeof indexedDB === "undefined" ? null : getOfflineDb());
    this.urlTemplate = deps.urlTemplate ?? DEFAULT_TILE_URL_TEMPLATE;
    this.fetchTileFn = deps.fetchTile ?? defaultFetchTile(this.urlTemplate);
  }

  /**
   * Downloads + stores every tile covering `bounds` at `zoomLevels`.
   * Progress is reported per tile (done/total). Never throws — a tile that
   * fails to fetch is skipped so one bad tile can't abort the region.
   */
  async cacheRegion(
    bounds: LatLngBoundsLike,
    zoomLevels: number[],
    onProgress?: (progress: CacheRegionProgress) => void,
  ): Promise<{ cached: number; skipped: number }> {
    if (!this.db) return { cached: 0, skipped: zoomLevels.length ? getTileCoordinates(bounds, zoomLevels).length : 0 };
    const tiles = getTileCoordinates(bounds, zoomLevels);
    let cached = 0;
    let skipped = 0;
    const total = tiles.length;

    for (let i = 0; i < total; i += 1) {
      const { z, x, y } = tiles[i];
      try {
        const bytes = await this.fetchTileFn(z, x, y);
        if (bytes.byteLength > 0) {
          await this.putTile(z, x, y, bytes);
          cached += 1;
        } else {
          skipped += 1;
        }
      } catch {
        skipped += 1;
      }
      onProgress?.({ done: i + 1, total, z });
    }
    return { cached, skipped };
  }

  /**
   * Returns the tile blob if it exists and is younger than 7 days; deletes
   * expired tiles on read and returns null (caller falls back to network).
   */
  async getTile(z: number, x: number, y: number): Promise<Blob | null> {
    if (!this.db) return null;
    const id = tileId(z, x, y);
    try {
      const row = await this.db.mapTiles.get(id);
      if (!row || !row.data) return null;
      if (Date.now() - new Date(row.fetchedAt).getTime() >= TILE_TTL_MS) {
        await this.db.mapTiles.delete(id);
        return null;
      }
      // Keep the tile hot for the LRU evictor.
      await this.db.mapTiles.update(id, { lastAccessedAt: new Date().toISOString() });
      return row.data;
    } catch {
      return null;
    }
  }

  /** True when a (non-expired) tile for z/x/y already exists. */
  async hasTile(z: number, x: number, y: number): Promise<boolean> {
    const blob = await this.getTile(z, x, y);
    return blob !== null;
  }

  /** Count of tiles cached for a region across the given zooms. */
  async countCachedTiles(bounds: LatLngBoundsLike, zoomLevels: number[]): Promise<number> {
    if (!this.db) return 0;
    const tiles = getTileCoordinates(bounds, zoomLevels);
    let count = 0;
    for (const { z, x, y } of tiles) {
      if (await this.hasTile(z, x, y)) count += 1;
    }
    return count;
  }

  /** Removes every cached tile (used by the Storage Manager reset). */
  async clearAllTiles(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.mapTiles.clear();
    } catch {
      // ignore
    }
  }

  /**
   * Fetches a tile from the network AND caches it for offline use. Used by
   * the MapLibre protocol when a tile is cold — the map gets its tile and
   * the next offline session already has it.
   */
  async fetchTileFallback(z: number, x: number, y: number): Promise<ArrayBuffer> {
    const bytes = await this.fetchTileFn(z, x, y);
    if (bytes.byteLength > 0 && this.db) {
      try {
        await this.putTile(z, x, y, bytes);
      } catch {
        // caching the fetched tile is best-effort
      }
    }
    return bytes;
  }

  private async putTile(z: number, x: number, y: number, bytes: ArrayBuffer): Promise<void> {
    const id = tileId(z, x, y);
    const now = new Date().toISOString();
    await this.db!.mapTiles.put({
      id,
      x,
      y,
      z,
      data: new Blob([bytes], { type: "image/png" }),
      fetchedAt: now,
      lastAccessedAt: now,
      expiresAt: new Date(Date.now() + TILE_TTL_MS).toISOString(),
    });
  }
}

/** Default network fetcher — reads the url template, fetches the tile. */
function defaultFetchTile(urlTemplate: string) {
  return async (z: number, x: number, y: number): Promise<ArrayBuffer> => {
    const url = urlTemplate.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`tile fetch failed: ${response.status} ${url}`);
    return response.arrayBuffer();
  };
}

export default OfflineMapManager;
