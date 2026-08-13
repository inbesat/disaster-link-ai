"use client";

// ---------------------------------------------------------------------
// components/offline/BackgroundSyncInit.tsx — Phase 7 · Step 2–3
// Mounted once per session; wires the invisible background-sync plumbing:
//
//   • One-shot Background Sync — once the service worker is ready, arms
//     `sync-predictions` + `sync-alerts` (SyncManager). The browser queues
//     these tags while offline and fires the worker's 'sync' event on
//     reconnect, so the sync engine refreshes without user intervention.
//     Degrades silently when SyncManager is unsupported.
//   • Periodic Background Sync — requests the user's permission, then arms
//     the 3h `disasterlink-sync` periodic tag where supported.
//   • SW sync relay — listens for the worker's `drip:sync:request` message
//     and runs a full page sync, so every SW sync tick lands in IndexedDB.
//
// Adds a "Synced X ✓" entry to the sync log on each completion via the
// `drip:sync:*` events the engine already emits.
// ---------------------------------------------------------------------

import { useEffect } from "react";
import { getSyncEngine } from "@/lib/offline-sync/sync-engine";
import { onSyncRequest, registerSyncJobs } from "@/lib/offline-sync/sw-sync";

export default function BackgroundSyncInit() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // SW sync-tick relay → full page sync.
    const unsubscribe = onSyncRequest(async () => {
      await getSyncEngine().fullSync({ force: true });
    });

    // Arm one-shot + periodic sync jobs once the SW is registered.
    void registerSyncJobs();

    return unsubscribe;
  }, []);

  return null;
}