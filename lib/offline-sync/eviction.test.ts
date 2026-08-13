// ---------------------------------------------------------------------
// lib/offline-sync/eviction.test.ts
// Phase 3 · 48h expiry purge + LRU map-tile eviction against the real
// Dexie schema (v2) on fake-indexeddb.
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getOfflineDb } from "./db";
import {
  MAP_TILE_BUDGET_BYTES,
  evictLruMapTiles,
  getCacheBreakdown,
  purgeExpired,
  touchMapTile,
} from "./eviction";

let counter = 0;
const uniqueDb = () => `evict-test-${counter++}-${Math.random().toString(36).slice(2, 8)}`;

describe("purgeExpired", () => {
  it("deletes rows older than their 48h expiresAt", async () => {
    const db = getOfflineDb(uniqueDb());
    const now = Date.now();
    await db.predictions.bulkPut([
      {
        id: "p-fresh",
        district: "Patna",
        data: {},
        cachedAt: new Date(now - 1000).toISOString(),
        expiresAt: new Date(now + 60_000).toISOString(),
      },
      {
        id: "p-expired",
        district: "Patna",
        data: {},
        cachedAt: new Date(now - 2 * 86400_000).toISOString(),
        expiresAt: new Date(now - 10_000).toISOString(),
      },
    ]);
    const removed = await purgeExpired(db);
    expect(removed).toBe(1);
    expect(await db.predictions.count()).toBe(1);
  });

  it("returns 0 when db is null (SSR)", async () => {
    expect(await purgeExpired(null)).toBe(0);
  });
});

describe("evictLruMapTiles", () => {
  it("keeps hot tiles and evicts cold ones to fit the budget", async () => {
    const db = getOfflineDb(uniqueDb());
    const now = Date.now();
    const makeTile = (id: string, lastAccessedAt: string, size: number) => ({
      id,
      x: 1,
      y: 1,
      z: 1,
      data: new Blob([new Uint8Array(size)]),
      fetchedAt: new Date(now).toISOString(),
      lastAccessedAt,
      expiresAt: new Date(now + 86400_000).toISOString(),
    });
    // 10 tiles of 1 MB each (10 MB total) with a 2 MB budget.
    for (let i = 0; i < 10; i++) {
      await db.mapTiles.put(makeTile(`tile-${i}`, new Date(now - i * 60_000).toISOString(), 1024 * 1024));
    }
    const deleted = await evictLruMapTiles(db, 2 * 1024 * 1024);
    expect(deleted).toBe(8); // coldest 8 removed, 2 hottest remain
    const left = await db.mapTiles.toArray();
    expect(left.map((t) => t.id).sort()).toEqual(["tile-0", "tile-1"]);
    expect(MAP_TILE_BUDGET_BYTES).toBe(50 * 1024 * 1024);
  });

  it("touchMapTile bumps lastAccessedAt so a tile survives", async () => {
    const db = getOfflineDb(uniqueDb());
    const old = new Date(Date.now() - 600_000).toISOString();
    await db.mapTiles.put({
      id: "t",
      x: 1,
      y: 2,
      z: 3,
      data: new Blob([new Uint8Array(1024)]),
      fetchedAt: old,
      lastAccessedAt: old,
      expiresAt: old,
    });
    await touchMapTile(db, "t");
    const tile = await db.mapTiles.get("t");
    expect(tile?.lastAccessedAt).toBeDefined();
    expect((tile?.lastAccessedAt ?? "") > old).toBe(true);
  });
});

describe("getCacheBreakdown", () => {
  it("reports live row counts per dataset", async () => {
    const db = getOfflineDb(uniqueDb());
    await db.resources.bulkPut([
      { id: "r1", district: "Patna", data: {}, cachedAt: "x", expiresAt: "y" },
      { id: "r2", district: "Patna", data: {}, cachedAt: "x", expiresAt: "y" },
    ]);
    const breakdown = await getCacheBreakdown(db);
    const resources = breakdown.find((e) => e.type === "resources");
    expect(resources?.rowCount).toBe(2);
    expect(resources?.sizeBytes).toBeGreaterThan(0);
  });
});