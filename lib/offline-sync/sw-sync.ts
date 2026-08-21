"use client";

// ---------------------------------------------------------------------
// lib/offline-sync/sw-sync.ts — Offline-First Architecture · Phase 2, 7 & 12
// Background sync bridge between the page and the service worker with exponential backoff retries.
// ---------------------------------------------------------------------

import { SYNC_EVENT_STARTED, SYNC_EVENT_FINISHED } from "./sync-engine";

export const SYNC_TAG = "disasterlink-sync";

export const BG_SYNC_TAGS = {
  predictions: "sync-predictions",
  alerts: "sync-alerts",
} as const;

export type BgSyncTag = (typeof BG_SYNC_TAGS)[keyof typeof BG_SYNC_TAGS];
export type BgSyncKey = keyof typeof BG_SYNC_TAGS;

/** True when the browser supports one-shot Background Sync. */
export function supportsBackgroundSync(): boolean {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;
  return "SyncManager" in window;
}

/**
 * Registers a one-shot background sync tag.
 */
export async function requestBackgroundSync(tag: BgSyncTag): Promise<boolean> {
  if (!supportsBackgroundSync()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const syncManager = reg as unknown as {
      sync?: { register: (tag: string) => Promise<void> };
    };
    if (!syncManager.sync) return false;
    await syncManager.sync.register(tag);
    return true;
  } catch {
    return false;
  }
}

/**
 * Registers background-sync jobs (predictions + alerts) and periodic sync.
 */
export async function registerSyncJobs(): Promise<Record<BgSyncKey | "periodic", boolean>> {
  const [predictions, alerts, periodic] = await Promise.all([
    requestBackgroundSync(BG_SYNC_TAGS.predictions),
    requestBackgroundSync(BG_SYNC_TAGS.alerts),
    requestPeriodicSync(),
  ]);
  return { predictions, alerts, periodic };
}

export function supportsPeriodicSync(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  return "PeriodicSyncManager" in window;
}

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

export async function unregisterPeriodicSync(): Promise<boolean> {
  if (!supportsPeriodicSync()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const syncApi = reg as unknown as {
      periodicSync?: { unregister: (tag: string) => Promise<void> };
    };
    if (!syncApi.periodicSync?.unregister) return false;
    await syncApi.periodicSync.unregister(SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

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
 * Execute an offline sync task with exponential backoff retries on network failure.
 * Formula: delay = baseDelayMs * 2^(attempt - 1)
 */
export async function syncWithExponentialBackoff<T>(
  syncTask: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await syncTask();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Page-side listener: SW `drip:sync:request` triggers sync with exponential backoff retries.
 */
export function onSyncRequest(syncFn: () => Promise<unknown>): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return () => undefined;
  const handler = (event: MessageEvent): void => {
    const data = event.data as { type?: string } | undefined;
    if (data?.type !== "drip:sync:request") return;
    window.dispatchEvent(new CustomEvent("drip:sync:sw"));
    void syncWithExponentialBackoff(syncFn).catch((err) => {
      console.warn("[SW Sync] Sync retries exhausted:", err);
    });
  };
  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
}

export { SYNC_EVENT_STARTED, SYNC_EVENT_FINISHED };
