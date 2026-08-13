// ---------------------------------------------------------------------
// lib/offline-sync/db.test.ts
// Phase 2 · Dexie schema: table creation, district index reads, and the
// metadata key/value store. Runs on fake-indexeddb so no browser needed.
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getOfflineDb, readDistrictRows } from "./db";

let dbNameCounter = 0;
const uniqueDbName = () => `db-test-${dbNameCounter++}-${Math.random().toString(36).slice(2, 8)}`;

beforeEach(() => {
  // Each test gets a brand-new database name; getOfflineDb caches per name,
  // so a fresh name == a fresh database.
  vi.resetModules();
});

describe("DisasterLinkDB", () => {
  it("creates all dataset tables with the district index", async () => {
    const db = getOfflineDb(uniqueDbName());
    const names = db.tables.map((t) => t.name).sort();
    expect(names).toContain("predictions");
    expect(names).toContain("alerts");
    expect(names).toContain("routes");
    expect(names).toContain("resources");
    expect(names).toContain("weather");
    expect(names).toContain("profiles");
    expect(names).toContain("maps");
    expect(names).toContain("knowledge");
    expect(names).toContain("metadata");
  });

  it("round-trips rows and reads them back by district", async () => {
    const db = getOfflineDb(uniqueDbName());
    const now = new Date().toISOString();
    await db.resources.bulkPut([
      { id: "s1", district: "Patna", data: { name: "Hall A" }, cachedAt: now, expiresAt: now },
      { id: "s2", district: "Patna", data: { name: "Hall B" }, cachedAt: now, expiresAt: now },
      { id: "s3", district: "Kamrup", data: { name: "Hall C" }, cachedAt: now, expiresAt: now },
    ]);

    const patnaRows = await readDistrictRows(db, "resources", "Patna");
    expect(patnaRows.map((r) => r.id)).toEqual(["s1", "s2"]);
  });

  it("stores and reads metadata key/value rows", async () => {
    const db = getOfflineDb(uniqueDbName());
    await db.metadata.put({ key: "lastFullSync", value: 123456789 });
    const row = await db.metadata.get("lastFullSync");
    expect(row?.value).toBe(123456789);
  });
});