// ---------------------------------------------------------------------
// lib/map/offline-map-manager.test.ts — Phase 8 · offline tile cache
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getOfflineDb } from "@/lib/offline-sync/db";
import { OfflineMapManager, TILE_TTL_MS } from "./offline-map-manager";

let counter = 0;
const uniqueDb = () => `tile-cache-${counter++}-${Math.random().toString(36).slice(2, 8)}`;

const BOUNDS = { north: 25.7, south: 25.4, east: 85.3, west: 85.0 };

/** Returns a stub tile payload so the db row carries real bytes. */
function stubBytes(byte: number): Uint8Array {
  return new Uint8Array([byte, byte, byte, byte, byte, byte, byte, byte]);
}

describe("OfflineMapManager", () => {
  it("caches every tile in a region and reads them back", async () => {
    const db = getOfflineDb(uniqueDb());
    const manager = new OfflineMapManager({
      db,
      fetchTile: async () => stubBytes(7).buffer as ArrayBuffer,
    });

    const { cached, skipped } = await manager.cacheRegion(BOUNDS, [1, 2]);
    expect(skipped).toBe(0);
    expect(cached).toBeGreaterThan(0);

    const rowCount = await db.mapTiles.count();
    expect(rowCount).toBe(cached);

    // Every cached tile is readable as a Blob.
    const rows = await db.mapTiles.toArray();
    for (const row of rows) {
      const blob = await manager.getTile(row.z, row.x, row.y);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob!.size).toBe(8);
    }
  });

  it("skips failed fetches and reports them as skipped", async () => {
    const db = getOfflineDb(uniqueDb());
    let calls = 0;
    const manager = new OfflineMapManager({
      db,
      fetchTile: async () => {
        calls += 1;
        if (calls === 1) throw new Error("network down");
        return stubBytes(1).buffer as ArrayBuffer;
      },
    });

    const { skipped } = await manager.cacheRegion(
      { north: 0.1, south: -0.1, east: 0.1, west: -0.1 },
      [1],
    );
    expect(skipped).toBe(1);
    // The other three tiles were still cached.
    expect(await db.mapTiles.count()).toBe(3);
  });

  it("returns null for a cold tile (SSR guard too)", async () => {
    const db = getOfflineDb(uniqueDb());
    const manager = new OfflineMapManager({ db });
    expect(await manager.getTile(11, 1682, 1160)).toBeNull();

    // db:null → same contract without throwing.
    const headless = new OfflineMapManager({ db: null });
    expect(await headless.getTile(0, 0, 0)).toBeNull();
  });

  it("expires tiles older than the 7-day TTL and deletes them", async () => {
    const db = getOfflineDb(uniqueDb());
    const manager = new OfflineMapManager({
      db,
      fetchTile: async () => stubBytes(3).buffer as ArrayBuffer,
    });
    await manager.cacheRegion(BOUNDS, [1]);

    // Age every cached tile beyond the TTL.
    const expired = new Date(Date.now() - TILE_TTL_MS - 1000).toISOString();
    const rows = await db.mapTiles.toArray();
    for (const row of rows) {
      await db.mapTiles.update(row.id, { fetchedAt: expired, expiresAt: expired });
    }

    const first = rows[0];
    expect(await manager.getTile(first.z, first.x, first.y)).toBeNull();
    expect(await db.mapTiles.count()).toBe(rows.length - 1); // deleted on read
  });

  it("counts cached tiles in a region and supports hasTile", async () => {
    const db = getOfflineDb(uniqueDb());
    const manager = new OfflineMapManager({
      db,
      fetchTile: async () => stubBytes(2).buffer as ArrayBuffer,
    });
    await manager.cacheRegion(BOUNDS, [1]);
    const count = await manager.countCachedTiles(BOUNDS, [1]);
    expect(count).toBeGreaterThan(0);
    const cached = await db.mapTiles.toArray();
    expect(cached.length).toBeGreaterThan(0);
    expect(await manager.hasTile(cached[0].z, cached[0].x, cached[0].y)).toBe(true);
    expect(await manager.hasTile(9, 0, 0)).toBe(false);
  });

  it("clearAllTiles empties the tile table", async () => {
    const db = getOfflineDb(uniqueDb());
    const manager = new OfflineMapManager({
      db,
      fetchTile: async () => stubBytes(9).buffer as ArrayBuffer,
    });
    await manager.cacheRegion(BOUNDS, [1]);
    expect(await db.mapTiles.count()).toBeGreaterThan(0);
    await manager.clearAllTiles();
    expect(await db.mapTiles.count()).toBe(0);
  });
});
