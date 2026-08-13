// ---------------------------------------------------------------------
// lib/offline-sync/storage-pressure.test.ts — Phase 9 pressure handler
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getOfflineDb } from "./db";
import {
  evaluateStoragePressure,
  listFreeUpActions,
  PRESSURE_WARNING_FRACTION,
  PRESSURE_SAFE_FREE_BYTES,
} from "./storage-pressure";
import type { StorageSnapshot } from "./types";

function snap(overrides: Partial<StorageSnapshot> = {}): StorageSnapshot {
  return {
    supported: true,
    usageBytes: 60 * 1024 * 1024,
    quotaBytes: 200 * 1024 * 1024,
    persisted: false,
    ...overrides,
  };
}

let counter = 0;
const uniqueDb = () => `pressure-${counter++}-${Math.random().toString(36).slice(2, 8)}`;

describe("evaluateStoragePressure", () => {
  it("reports ok for healthy usage", async () => {
    const p = await evaluateStoragePressure(snap({ usageBytes: 40 * 1024 * 1024 }));
    expect(p.level).toBe("ok");
  });

  it("reports warning when over PRESSURE_WARNING_FRACTION of quota", async () => {
    const p = await evaluateStoragePressure(
      snap({ usageBytes: Math.floor(snap().quotaBytes * PRESSURE_WARNING_FRACTION) + 1 * 1024 * 1024 }),
    );
    expect(p.level).toBe("warning");
    expect(p.message.toLowerCase()).toContain("nearly full");
  });

  it("reports critical when free space is below the safe buffer", async () => {
    const p = await evaluateStoragePressure(
      snap({ usageBytes: snap().quotaBytes - PRESSURE_SAFE_FREE_BYTES }),
    );
    expect(p.level).toBe("critical");
  });

  it("never throws for unsupported storage", async () => {
    const p = await evaluateStoragePressure({ supported: false, usageBytes: 0, quotaBytes: 0, persisted: false });
    expect(p.level).toBe("ok");
  });
});

describe("listFreeUpActions", () => {
  it("offers clear-tiles and reduce-history actions with db access", async () => {
    const db = getOfflineDb(uniqueDb());
    await db.mapTiles.put({
      id: "1/0/0",
      x: 0,
      y: 0,
      z: 1,
      data: new Blob([new Uint8Array(1000)]),
      fetchedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400_000).toISOString(),
    });
    await db.chatHistory.bulkPut([
      { id: "a", sessionId: "s", role: "user", content: "hi", timestamp: "2026-01-01" },
      { id: "b", sessionId: "s", role: "assistant", content: "hello", timestamp: "2026-01-02" },
    ]);

    const actions = await listFreeUpActions(db);
    expect(actions.map((a) => a.id)).toEqual(["clear-tiles", "reduce-history"]);

    // Clearing tiles returns the number of tiles freed.
    const tilesFreed = await actions[0].run();
    expect(tilesFreed).toBe(1);
    expect(await db.mapTiles.count()).toBe(0);

    // Running reduce-history keeps half the turns.
    const historyFreed = await actions[1].run();
    expect(historyFreed).toBeGreaterThan(0);
    expect(await db.chatHistory.count()).toBeLessThan(2);
  });

  it("returns [] without IndexedDB (SSR)", async () => {
    expect(await listFreeUpActions(null)).toEqual([]);
  });
});