"use client";

// ---------------------------------------------------------------------
// lib/offline-sync/sync-engine.ts — Offline-First Architecture · Phase 2
// OfflineSyncEngine: the background system that downloads + caches all
// critical disaster data whenever the device has internet, so field
// responders keep the last 48 hours of context during comms blackouts.
//
//   • Priority queue — datasets run critical → high → normal → low, but
//     concurrent within a band (Promise.allSettled) so a slow source never
//     blocks the whole sync.
//   • 48h TTL — every cached row expires after the dataset's ttlHours and
//     is pruned by getOfflineData / status reads.
//   • Scheduling — a 3-hour interval runs a full sync only when the
//     connectivity monitor reports online; the browser 'online' event also
//     kicks an immediate sync on reconnect.
//   • SSR-safe — all IndexedDB work is guarded by hasIndexedDB(); callers
//     in Node get empty results instead of crashing.
//   • Events — emits `drip:sync:*` window events so hooks/useSyncStatus.ts
//     can react without polling.
// ---------------------------------------------------------------------

import { configForType, DATA_SOURCE_CONFIGS, PRIORITY_ORDER, SYNC_DISTRICTS } from "./config";
import { getOfflineDb, type DisasterLinkDB } from "./db";
import type {
  DataSourceConfig,
  DataType,
  OfflineRecord,
  SyncStatus,
  SyncStatusEntry,
  SyncPriority,
} from "./types";
import { getConnectivityMonitor, type ConnectivityMonitor } from "@/lib/ai-bridge/connectivity";

export const SYNC_EVENT_UPDATED = "drip:sync:updated";
export const SYNC_EVENT_STARTED = "drip:sync:started";
export const SYNC_EVENT_FINISHED = "drip:sync:finished";

export const OFFLINE_WINDOW_HOURS = 48;
export const DEFAULT_SYNC_INTERVAL_MS = 3 * 60 * 60 * 1000; // every 3h when online

export interface SyncEngineOptions {
  /** Districts to cache (defaults to SYNC_DISTRICTS). */
  districts?: string[];
  /** DataSourceConfig list override (tests). */
  sources?: DataSourceConfig<unknown>[];
  /** ConnectivityMonitor override (tests / prewired bridge). */
  monitor?: ConnectivityMonitor;
  /** Sync interval (tests override to avoid real timers). */
  intervalMs?: number;
  /** Skip auto-starting the scheduler (tests call syncFull directly). */
  autostart?: boolean;
  /** DB name override (tests use a unique temp db). */
  dbName?: string;
  /** Run even when the monitor reports offline (tests / forced). */
  force?: boolean;
}

/** Emits a window CustomEvent, no-op in SSR. */
function emitSyncEvent(name: string, detail?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name, { detail: detail ?? {} }));
}

export class OfflineSyncEngine {
  private readonly districts: string[];
  private readonly sources: DataSourceConfig<unknown>[];
  private readonly monitor: ConnectivityMonitor;
  private readonly intervalMs: number;
  private readonly dbName: string;
  private readonly force: boolean;
  private timer: ReturnType<typeof setInterval> | null = null;
  private syncingNow = false;
  private nextSyncAt: number | null = null;
  private lastFullSync: number | null = null;
  private db: DisasterLinkDB | null = null;

  constructor(options: SyncEngineOptions = {}) {
    this.districts = options.districts ?? [...SYNC_DISTRICTS];
    this.sources = options.sources ?? [...DATA_SOURCE_CONFIGS];
    this.monitor = options.monitor ?? getConnectivityMonitor();
    this.intervalMs = options.intervalMs ?? DEFAULT_SYNC_INTERVAL_MS;
    this.dbName = options.dbName ?? "disasterlink-offline";
    this.force = options.force ?? false;
    if (options.autostart !== false) this.start();
  }

  private getDb(): DisasterLinkDB | null {
    if (typeof indexedDB === "undefined") return null;
    if (!this.db) this.db = getOfflineDb(this.dbName);
    return this.db;
  }

  /** Starts the 3-hour scheduler + online-event immediate sync. */
  start(): void {
    if (typeof window === "undefined" || this.timer) return;
    this.timer = setInterval(() => void this.tick(), this.intervalMs);
    window.addEventListener("online", this.handleReconnect);
  }

  private handleReconnect = (): void => {
    void this.tick();
  };

  /** Stops the scheduler + listeners (safe to call twice). */
  stop(): void {
    if (typeof window === "undefined") return;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    window.removeEventListener("online", this.handleReconnect);
  }

  /** Scheduled tick — runs a full sync only when online. */
  private async tick(): Promise<void> {
    const snapshot = this.monitor.getSnapshot();
    if (!snapshot.online && !this.force) return;
    await this.fullSync();
  }

  /**
   * Runs the full 48h sync: every dataset × every district, ordered by
   * priority band and settled independently so no single failure aborts the
   * batch. Writes `lastFullSync` metadata on completion. Honors the
   * connectivity monitor unless forced (syncNow / constructor force flag).
   */
  async fullSync(options: { force?: boolean } = {}): Promise<{ synced: number; failed: number }> {
    const db = this.getDb();
    if (!db) return { synced: 0, failed: 0 };
    if (this.syncingNow) return { synced: 0, failed: 0 };

    const force = options.force ?? this.force;
    const snapshot = this.monitor.getSnapshot();
    if (!snapshot.online && !force) return { synced: 0, failed: 0 };

    this.syncingNow = true;
    emitSyncEvent(SYNC_EVENT_STARTED);
    this.nextSyncAt = Date.now() + this.intervalMs;

    const byPriority = (a: DataSourceConfig, b: DataSourceConfig) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    const ordered = [...this.sources].sort(byPriority);

    let synced = 0;
    let failed = 0;
    let index = 0;
    while (index < ordered.length) {
      // Take one full priority band and run it concurrently.
      const band = ordered[index].priority;
      const bandSources = ordered.filter((s) => s.priority === band);
      index += bandSources.length;

      const results = await Promise.allSettled(
        bandSources.flatMap((source) =>
          this.districts.map((district) => this.syncDataset(db, source, district)),
        ),
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) synced += 1;
        else failed += 1;
      }
    }

    this.lastFullSync = Date.now();
    try {
      await db.metadata.put({ key: "lastFullSync", value: this.lastFullSync });
    } catch {
      // metadata write failure is non-fatal — status still derives live.
    }

    this.syncingNow = false;
    emitSyncEvent(SYNC_EVENT_FINISHED, { synced, failed });
    return { synced, failed };
  }

  /** Fetches one dataset for one district and upserts cached rows. */
  private async syncDataset(
    db: DisasterLinkDB,
    source: DataSourceConfig<unknown>,
    district: string,
  ): Promise<boolean> {
    try {
      const rows = await source.fetch({ district });
      const now = Date.now();
      const ttlMs = source.ttlHours * 60 * 60 * 1000;
      const records: OfflineRecord[] = rows.map((row) => {
        const idOf = source.idOf ?? ((r: unknown) => String((r as { id?: unknown }).id ?? `${district}:${Math.random().toString(36).slice(2, 7)}`));
        return {
          id: idOf(row),
          district,
          data: row,
          cachedAt: new Date(now).toISOString(),
          expiresAt: new Date(now + ttlMs).toISOString(),
        };
      });
      if (records.length === 0) return true; // empty source is a valid sync

      await db.transaction("rw", db[source.type], async () => {
        await db[source.type].bulkPut(records);
        // Prune rows past the 48h window for this district.
        const stale = await db[source.type]
          .where("district")
          .equals(district)
          .filter((r) => new Date(r.expiresAt).getTime() < now)
          .toArray();
        if (stale.length) await db[source.type].bulkDelete(stale.map((r) => r.id));
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Always reads from IndexedDB, never the network. Returns rows that are
   * still inside the 48h window (expired rows are pruned on read).
   */
  async getOfflineData<T = unknown>(
    type: DataType,
    district: string,
  ): Promise<Array<OfflineRecord<T>>> {
    const db = this.getDb();
    if (!db) return [];
    try {
      const rows = await db[type].where("district").equals(district).toArray();
      const now = Date.now();
      const fresh = rows.filter((r) => new Date(r.expiresAt).getTime() >= now);
      const stale = rows.filter((r) => new Date(r.expiresAt).getTime() < now);
      if (stale.length) await db[type].bulkDelete(stale.map((r) => r.id));
      return fresh as Array<OfflineRecord<T>>;
    } catch {
      return [];
    }
  }

  /** Forces an immediate full sync regardless of connectivity. */
  async syncNow(): Promise<{ synced: number; failed: number }> {
    return this.fullSync();
  }

  /**
   * Syncs every dataset for ONE district (priority-ordered, like fullSync).
   * Convenience surface for lib/offline/syncEngine.ts#syncOfflineData —
   * refreshes the full 48h cache for a single district instead of the
   * whole configured set.
   */
  async syncDistrict(district: string): Promise<{ synced: number; failed: number }> {
    const db = this.getDb();
    if (!db) return { synced: 0, failed: 0 };
    const byPriority = (a: DataSourceConfig, b: DataSourceConfig) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    const ordered = [...this.sources].sort(byPriority);

    let synced = 0;
    let failed = 0;
    let index = 0;
    while (index < ordered.length) {
      const band = ordered[index].priority;
      const bandSources = ordered.filter((s) => s.priority === band);
      index += bandSources.length;

      const results = await Promise.allSettled(
        bandSources.map((source) => this.syncDataset(db, source, district)),
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) synced += 1;
        else failed += 1;
      }
    }

    emitSyncEvent(SYNC_EVENT_UPDATED, { type: "all", district });
    return { synced, failed };
  }

  /** Syncs a single dataset type across all configured districts. */
  async syncType(type: DataType): Promise<{ synced: number; failed: number }> {
    const db = this.getDb();
    if (!db) return { synced: 0, failed: 0 };
    const source = this.sources.find((s) => s.type === type) ?? configForType(type);
    if (!source) return { synced: 0, failed: 0 };
    const results = await Promise.allSettled(
      this.districts.map((district) => this.syncDataset(db, source, district)),
    );
    const synced = results.filter((r) => r.status === "fulfilled" && r.value).length;
    emitSyncEvent(SYNC_EVENT_UPDATED, { type, district: this.districts.join(",") });
    return { synced, failed: this.districts.length - synced };
  }

  /** Live freshness snapshot for useSyncStatus(). */
  async getStatus(): Promise<SyncStatus> {
    const db = this.getDb();
    const snapshot = this.monitor.getSnapshot();
    const now = Date.now();
    const datasets: SyncStatusEntry[] = [];

    for (const source of DATA_SOURCE_CONFIGS) {
      let rowCount = 0;
      let lastSyncedAt: string | null = null;
      if (db) {
        try {
          const rows = await db[source.type].toArray();
          rowCount = rows.length;
          lastSyncedAt =
            rows.length > 0
              ? rows.reduce((latest, r) =>
                  r.cachedAt > latest ? r.cachedAt : latest,
                "" as string,
              )
              : null;
        } catch {
          // table missing (first run) — treat as empty
        }
      }
      const fresh =
        !!lastSyncedAt && now - new Date(lastSyncedAt).getTime() <= source.ttlHours * 3600_000;
      const avgRowBytes = source.sizeBytes / Math.max(1, source.expectedRows ?? 1);
      datasets.push({
        type: source.type,
        lastSyncedAt,
        rowCount,
        sizeBytes: Math.round(rowCount * avgRowBytes),
        fresh,
        syncing: this.syncingNow,
      });
    }

    return {
      online: snapshot.online,
      lastFullSync: this.lastFullSync,
      nextSyncAt: this.nextSyncAt,
      syncing: this.syncingNow,
      datasets,
      districts: [...this.districts],
    };
  }

  /** Estimate of total bytes cached across all datasets. */
  async estimateCacheBytes(): Promise<number> {
    const status = await this.getStatus();
    return status.datasets.reduce((sum, d) => sum + d.sizeBytes, 0);
  }
}

/** App-wide singleton — the engine the hook + SW message route to. */
let sharedEngine: OfflineSyncEngine | null = null;

export function getSyncEngine(): OfflineSyncEngine {
  if (!sharedEngine) sharedEngine = new OfflineSyncEngine();
  return sharedEngine;
}