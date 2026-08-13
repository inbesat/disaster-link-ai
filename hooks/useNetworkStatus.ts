"use client";

// ---------------------------------------------------------------------
// hooks/useNetworkStatus.ts — Offline-First Architecture · Phase 7
// Powers the floating "Network Status" widget (green / orange / red dot).
//
//   • online + cached + fresh → "Synced X min ago"  (green)
//   • offline + cached data  → "Offline — Using cached data (Xh old)"
//     (orange)
//   • offline + no cache     → "Offline — No data available" (red)
//
// Combines the connectivity monitor, the offline sync engine's freshness
// snapshot and the persisted sync log, and appends a "Synced X ✓" entry to
// the log every time a sync band finishes. SSR-safe (resolves defaults).
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SYNC_EVENT_FINISHED,
  SYNC_EVENT_UPDATED,
  getSyncEngine,
} from "@/lib/offline-sync/sync-engine";
import {
  SYNC_LOG_EVENT,
  appendSyncLogEntry,
  getSyncLog,
  clearSyncLog,
  type SyncLogEntry,
} from "@/lib/offline-sync/sync-log";
import { getConnectivityMonitor } from "@/lib/ai-bridge/connectivity";

export type NetworkState = "online" | "offline-cached" | "offline-empty";

export interface NetworkStatus {
  state: NetworkState;
  /** "5 min ago", "2h old", etc. for the pill label. */
  label: string;
  /** True while the device is (browser + backend) reachable. */
  online: boolean;
  /** Age of the newest cached row in ms (Infinity when none). */
  cacheAgeMs: number;
  /** Newest cached row count across all datasets. */
  cachedRows: number;
  log: SyncLogEntry[];
  logRefreshKey: number;
  clearLog: () => void;
}

/** Human "age" label: "just now", "5 min ago", "2h old". */
export function formatAge(ageMs: number, online: boolean): string {
  if (!Number.isFinite(ageMs)) return online ? "never synced" : "no data";
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ${online ? "ago" : "old"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${online ? "ago" : "old"}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${online ? "ago" : "old"}`;
}

export function useNetworkStatus(): NetworkStatus {
  const [online, setOnline] = useState(true);
  const [cacheAgeMs, setCacheAgeMs] = useState(Number.POSITIVE_INFINITY);
  const [cachedRows, setCachedRows] = useState(0);
  const [log, setLog] = useState<SyncLogEntry[]>(() => getSyncLog());
  const [logRefreshKey, setLogRefreshKey] = useState(0);
  const monitorRef = useRef<ReturnType<typeof getConnectivityMonitor> | null>(
    typeof window === "undefined" ? null : getConnectivityMonitor(),
  );
  const engineRef = useRef<ReturnType<typeof getSyncEngine> | null>(
    typeof window === "undefined" ? null : getSyncEngine(),
  );

  useEffect(() => {
    const monitor = monitorRef.current;
    const engine = engineRef.current;
    if (!monitor || !engine) return;
    let cancelled = false;

    const refresh = async (): Promise<void> => {
      const snapshot = monitor.getSnapshot();
      const status = await engine.getStatus();
      if (cancelled) return;

      const rows = status.datasets.reduce((sum, d) => sum + d.rowCount, 0);
      let newest = Number.POSITIVE_INFINITY;
      for (const dataset of status.datasets) {
        if (!dataset.lastSyncedAt) continue;
        const at = new Date(dataset.lastSyncedAt).getTime();
        if (at < newest) newest = at;
      }
      const age = Number.isFinite(newest) ? Date.now() - newest : Number.POSITIVE_INFINITY;

      setOnline(snapshot.online);
      setCacheAgeMs(age);
      setCachedRows(rows);
    };

    void refresh();
    const unsubscribe = monitor.subscribe(() => void refresh());
    const events = [SYNC_EVENT_FINISHED, SYNC_EVENT_UPDATED];
    const onSync = (): void => void refresh();
    for (const event of events) window.addEventListener(event, onSync);
    const onLog = (): void => {
      setLog(getSyncLog());
      setLogRefreshKey((k) => k + 1);
    };
    window.addEventListener(SYNC_LOG_EVENT, onLog);

    // Log "Synced X ✓" entries when a sync band finishes (online) or a
    // dataset type updates.
    const onSyncFinished = (e: Event): void => {
      const detail = (e as CustomEvent<{ synced?: number; failed?: number }>).detail ?? {};
      const synced = detail.synced ?? 0;
      if (synced > 0) {
        appendSyncLogEntry(`Synced ${synced} dataset${synced === 1 ? "" : "s"} ✓`);
      } else {
        appendSyncLogEntry("Sync check — nothing to refresh");
      }
    };
    const onSyncUpdated = (e: Event): void => {
      const detail = (e as CustomEvent<{ type?: string }>).detail ?? {};
      if (typeof detail.type === "string" && detail.type !== "all") {
        appendSyncLogEntry(`Synced ${detail.type} ✓`);
      }
    };
    window.addEventListener(SYNC_EVENT_FINISHED, onSyncFinished);
    window.addEventListener(SYNC_EVENT_UPDATED, onSyncUpdated);

    return () => {
      cancelled = true;
      unsubscribe();
      for (const event of events) window.removeEventListener(event, onSync);
      window.removeEventListener(SYNC_LOG_EVENT, onLog);
      window.removeEventListener(SYNC_EVENT_FINISHED, onSyncFinished);
      window.removeEventListener(SYNC_EVENT_UPDATED, onSyncUpdated);
    };
  }, []);

  const state: NetworkState = online
    ? "online"
    : cachedRows > 0
      ? "offline-cached"
      : "offline-empty";

  const label =
    state === "online"
      ? `Synced ${formatAge(cacheAgeMs, true)}`
      : state === "offline-cached"
        ? `Offline — Using cached data (${formatAge(cacheAgeMs, false)})`
        : "Offline — No data available";

  const clearLog = useCallback(() => {
    clearSyncLog();
    setLog(getSyncLog());
    setLogRefreshKey((k) => k + 1);
  }, []);

  return {
    state,
    label,
    online,
    cacheAgeMs,
    cachedRows,
    log,
    logRefreshKey,
    clearLog,
  };
}

export default useNetworkStatus;
