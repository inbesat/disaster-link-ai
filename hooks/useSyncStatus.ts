"use client";

// ---------------------------------------------------------------------
// hooks/useSyncStatus.ts — Offline-First Architecture · Phase 2 · D4
// useSyncStatus(): reactive snapshot of the 48h offline sync engine for
// the Sync Status dashboard:
//
//   const { status, syncNow, syncing, online } = useSyncStatus();
//
//   • Live freshness per dataset (green checkmark = synced within TTL,
//     orange = stale), row counts and storage estimates.
//   • lastFullSync / nextSyncAt for the header "Last synced / Next sync".
//   • `syncNow()` to force a background full sync.
//   • Listens to the engine's `drip:sync:*` window events so the grid
//     refreshes the moment a band finishes — no polling.
//   • SSR-safe: resolves an empty/default status on the server.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SYNC_EVENT_UPDATED,
  SYNC_EVENT_STARTED,
  SYNC_EVENT_FINISHED,
  getSyncEngine,
} from "@/lib/offline-sync/sync-engine";
import type { SyncStatus, DataType } from "@/lib/offline-sync/types";
import { isDataType } from "@/lib/offline-sync/types";

const EMPTY_STATUS: SyncStatus = {
  online: true,
  lastFullSync: null,
  nextSyncAt: null,
  syncing: false,
  datasets: [],
  districts: [],
};

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(EMPTY_STATUS);
  const engine = useRef<ReturnType<typeof getSyncEngine> | null>(
    typeof window === "undefined" ? null : getSyncEngine(),
  );

  // Initial load + refresh on every engine event.
  useEffect(() => {
    if (!engine.current) return;
    let cancelled = false;
    const refresh = async (): Promise<void> => {
      const next = await engine.current?.getStatus();
      if (next && !cancelled) setStatus(next);
    };
    void refresh();

    const events = [SYNC_EVENT_UPDATED, SYNC_EVENT_STARTED, SYNC_EVENT_FINISHED];
    const handler = (): void => void refresh();
    for (const event of events) window.addEventListener(event, handler);
    // Live status + auto-start of the scheduler handled by the engine.
    return () => {
      cancelled = true;
      for (const event of events) window.removeEventListener(event, handler);
    };
  }, []);

  const syncNow = useCallback(async () => {
    await engine.current?.syncNow();
  }, []);

  const syncType = useCallback(async (type: string) => {
    if (!isDataType(type)) return;
    await engine.current?.syncType(type as DataType);
  }, []);

  return {
    status,
    syncing: status.syncing,
    online: status.online,
    lastFullSync: status.lastFullSync,
    nextSyncAt: status.nextSyncAt,
    datasets: status.datasets,
    districts: status.districts,
    syncNow,
    syncType,
  };
}

export default useSyncStatus;