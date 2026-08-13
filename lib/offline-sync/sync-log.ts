"use client";

// ---------------------------------------------------------------------
// lib/offline-sync/sync-log.ts — Offline-First Architecture · Phase 7
// Timestamped sync log backing the Network Status widget's expandable
// list ("Synced predictions ✓", "Synced alerts ✓", "Downloaded map tiles
// ✓"). Entries are persisted to localStorage so the log survives refresh,
// and every mutation dispatches `drip:sync-log:updated` so the widget
// re-renders the moment a sync completes.
//
// Pure + injectable (storage + now passed in) so the module is fully
// unit-testable in the node-only vitest env.
// ---------------------------------------------------------------------

export interface SyncLogEntry {
  id: string;
  /** Human label, e.g. "Synced predictions ✓". */
  text: string;
  /** Epoch ms — when the sync step completed. */
  at: number;
}

export const SYNC_LOG_EVENT = "drip:sync-log:updated";

/** Storage key for the persisted log. */
export const SYNC_LOG_KEY = "drip:sync-log";

/** Max entries kept (oldest evicted first). */
export const SYNC_LOG_MAX = 50;

export type SyncLogStorage = Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;

function defaultStorage(): SyncLogStorage {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(storage: SyncLogStorage): SyncLogEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(SYNC_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as SyncLogEntry[]).filter(
          (e): e is SyncLogEntry =>
            !!e && typeof e.text === "string" && typeof e.at === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function write(storage: SyncLogStorage, entries: SyncLogEntry[]): void {
  if (!storage) return;
  try {
    storage.setItem(SYNC_LOG_KEY, JSON.stringify(entries.slice(-SYNC_LOG_MAX)));
  } catch {
    // non-fatal — the log simply won't persist this session
  }
}

/** Emits the update event so the widget refreshes. SSR-safe. */
function emitChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SYNC_LOG_EVENT));
}

/** All log entries, newest first. */
export function getSyncLog(storage: SyncLogStorage = defaultStorage()): SyncLogEntry[] {
  return read(storage).slice().reverse();
}

/**
 * Appends one entry (dedupes consecutive identical texts), caps the log at
 * SYNC_LOG_MAX and notifies listeners. Returns the created entry.
 */
export function appendSyncLogEntry(
  text: string,
  storage: SyncLogStorage = defaultStorage(),
  now: () => number = Date.now,
): SyncLogEntry {
  const entries = read(storage);
  const at = now();
  // Coalesce rapid repeats ("Synced predictions ✓" × 3 in a burst) into one.
  const last = entries[entries.length - 1];
  if (last && last.text === text && at - last.at < 10_000) {
    last.at = at;
    write(storage, entries);
    emitChanged();
    return last;
  }
  const entry: SyncLogEntry = { id: `${at}-${Math.random().toString(36).slice(2, 8)}`, text, at };
  write(storage, [...entries, entry]);
  emitChanged();
  return entry;
}

/** Clears the persisted log (the widget's "Clear" affordance). */
export function clearSyncLog(storage: SyncLogStorage = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.removeItem(SYNC_LOG_KEY);
  } catch {
    // ignore
  }
  emitChanged();
}

export default getSyncLog;
