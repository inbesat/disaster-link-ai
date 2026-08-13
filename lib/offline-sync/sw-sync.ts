"use client";

// ---------------------------------------------------------------------
// lib/offline-sync/sw-sync.ts — Offline-First Architecture · Phase 2
// Background sync bridge between the page and the service worker.
//
//   • requestPeriodicSync() — registers the `disasterlink-sync` periodic
//     background sync tag (Periodic Background Sync API) where supported so
//     the OS can wake the SW to nudge a pending sync. Degrades silently to
//     no-op on unsupported browsers (Chrome desktop 80+).
//   • postSyncRequest() — asks the SW to dispatch a `sync` broadcast to all
//     open clients (the controller page listens and runs fullSync()).
//   • onSyncRequest() — page-side listener wired in the hook: any SW
//     `drip:sync:request` message → fullSync().
//
// The actual IndexedDB writes always run in the page's SyncEngine (the SW
// has no module access to the Dexie wrapper); the SW is nudge/relay only.
// ---------------------------------------------------------------------

import { SYNC_EVENT_STARTED, SYNC_EVENT_FINISHED } from "./sync-engine";

export const SYNC_TAG = "disasterlink-sync";

/** True when the browser supports Periodic Background Sync. */
export function supportsPeriodicSync(): boolean {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  const container = navigator.serviceWorker as unknown as {
    periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
  };
  return "periodicSync" in container;
}

/**
 * Registers a periodic background-sync tag (min interval 3h) so supported
 * browsers can trigger sync even after the page is backgrounded. Resolves
 * false (never throws) when unsupported / not registered.
 */
export async function requestPeriodicSync(
  minIntervalMs = 3 * 60 * 60 * 1000,
): Promise<boolean> {
  if (!supportsPeriodicSync()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const syncApi = reg as unknown as {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    };
    if (!syncApi.periodicSync) return false;
    await syncApi.periodicSync.register(SYNC_TAG, { minInterval: minIntervalMs });
    return true;
  } catch {
    return false;
  }
}

/** Asks the SW to broadcast a sync request to all open page clients. */
export async function postSyncRequest(): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator) ||
    !navigator.serviceWorker.controller
  ) {
    return false;
  }
  try {
    navigator.serviceWorker.controller.postMessage({ type: "drip:sync:request" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Page-side listener: any SW `drip:sync:request` message (periodic bg-sync
 * event or an explicit nudge) triggers a full sync. Returns an unsubscribe
 * function so the hook can clean up on unmount.
 */
export function onSyncRequest(syncFn: () => Promise<unknown>): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return () => undefined;
  const handler = (event: MessageEvent): void => {
    const data = event.data as { type?: string } | undefined;
    if (data?.type !== "drip:sync:request") return;
    window.dispatchEvent(new CustomEvent("drip:sync:sw"));
    void syncFn();
  };
  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

export { SYNC_EVENT_STARTED, SYNC_EVENT_FINISHED };