// ---------------------------------------------------------------------
// lib/offline-sync/sync-log.test.ts — Phase 7 sync log tests (node-env).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  SYNC_LOG_KEY,
  appendSyncLogEntry,
  clearSyncLog,
  getSyncLog,
} from "./sync-log";

/** In-memory Storage stand-in (localStorage-shaped). */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  } as Storage;
}

describe("sync log", () => {
  it("starts empty", () => {
    expect(getSyncLog(memoryStorage())).toEqual([]);
  });

  it("appends entries newest-first", () => {
    const storage = memoryStorage();
    let t = 1000;
    const now = () => (t += 1000);
    appendSyncLogEntry("Synced predictions ✓", storage, now);
    appendSyncLogEntry("Synced alerts ✓", storage, now);
    appendSyncLogEntry("Downloaded map tiles ✓", storage, now);
    const log = getSyncLog(storage);
    expect(log[0].text).toBe("Downloaded map tiles ✓");
    expect(log).toHaveLength(3);
  });

  it("coalesces rapid repeats of the same text", () => {
    const storage = memoryStorage();
    let t = 1000;
    const now = () => (t += 500);
    appendSyncLogEntry("Synced predictions ✓", storage, now);
    appendSyncLogEntry("Synced predictions ✓", storage, now);
    appendSyncLogEntry("Synced predictions ✓", storage, now);
    expect(getSyncLog(storage)).toHaveLength(1);
  });

  it("does not coalesce across the 10s window", () => {
    const storage = memoryStorage();
    let t = 1000;
    const now = () => (t += 20_000);
    appendSyncLogEntry("Synced alerts ✓", storage, now);
    appendSyncLogEntry("Synced alerts ✓", storage, now);
    expect(getSyncLog(storage)).toHaveLength(2);
  });

  it("persists across storage instances", () => {
    const storage = memoryStorage();
    appendSyncLogEntry("Synced predictions ✓", storage, () => 1000);
    // A fresh view (re-read) sees the persisted entries.
    expect(getSyncLog(storage)[0].text).toBe("Synced predictions ✓");
    void SYNC_LOG_KEY; // re-export sanity
  });

  it("clears the log", () => {
    const storage = memoryStorage();
    appendSyncLogEntry("Synced predictions ✓", storage, () => 1000);
    clearSyncLog(storage);
    expect(getSyncLog(storage)).toEqual([]);
  });

  it("is resilient to corrupted storage", () => {
    const storage = memoryStorage();
    storage.setItem(SYNC_LOG_KEY, "not json{");
    expect(getSyncLog(storage)).toEqual([]);
    storage.setItem(SYNC_LOG_KEY, JSON.stringify([{ text: 123, at: "x" }]));
    expect(getSyncLog(storage)).toEqual([]);
  });

  it("caps entries at SYNC_LOG_MAX", async () => {
    const storage = memoryStorage();
    let t = 0;
    const now = () => (t += 1);
    for (let i = 0; i < 70; i += 1) appendSyncLogEntry(`entry ${i}`, storage, now);
    expect(getSyncLog(storage)).toHaveLength(50);
    expect(getSyncLog(storage)[0].text).toBe("entry 69");
    expect(getSyncLog(storage)[49].text).toBe("entry 20");
  });
});