// ---------------------------------------------------------------------
// lib/offline-sync/quota.ts — Offline-First Architecture · Phase 3
// Storage budget: 200 MB soft cap over whatever the browser grants
// (usually 10-20% of free disk). checkStorageQuota() reports the live
// estimate + persistent-storage grant so the Storage Manager gauge can
// render "45 MB / 200 MB" truthfully and warn before the model download.
//
//   const snap = await checkStorageQuota();       // { usage, quota, ... }
//   formatBytes(45_000_000)                        // "42.9 MB"
//   formatBytes(1_300_000_000)                     // "1.21 GB"
//
// SSR-safe: returns `{ supported: false }` outside a browser context.
// ---------------------------------------------------------------------

import type { StorageSnapshot } from "./types";

/** Soft budget we aim to stay under (browser quota is usually larger). */
export const STORAGE_BUDGET_BYTES = 200 * 1024 * 1024; // 200 MB

/** Minimum bytes required before the local model download is offered. */
export const MODEL_DOWNLOAD_MIN_BYTES = 1.3 * 1024 * 1024 * 1024; // ~1.3 GB

/**
 * Live storage snapshot from navigator.storage.estimate() + persist().
 * Never throws: browsers without the Storage API resolve supported:false.
 */
export async function checkStorageQuota(): Promise<StorageSnapshot> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { supported: false, usageBytes: 0, quotaBytes: 0, persisted: false };
  }
  try {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage ?? 0;
    const quotaBytes = estimate.quota ?? 0;
    let persisted = false;
    try {
      persisted = Boolean(await navigator.storage.persisted());
    } catch {
      // persisted() unsupported — default to false.
    }
    return { supported: true, usageBytes, quotaBytes, persisted };
  } catch (error: unknown) {
    return {
      supported: false,
      usageBytes: 0,
      quotaBytes: 0,
      persisted: false,
      error: error instanceof Error ? error.message : "Storage estimate unavailable",
    };
  }
}

/** Requests persistent storage (immune to browser auto-eviction). */
export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/** True when the browser reports enough free quota for the local model. */
export async function canFitLocalModel(): Promise<boolean> {
  const snap = await checkStorageQuota();
  if (!snap.supported || snap.quotaBytes <= 0) return false;
  return snap.quotaBytes - snap.usageBytes >= MODEL_DOWNLOAD_MIN_BYTES;
}

/**
 * Human-readable byte formatting (decimal units, matching the Storage
 * Manager UI's "45 MB / 200 MB" labels).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const magnitude = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / Math.pow(1024, magnitude);
  const rendered = magnitude === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  return `${rendered} ${units[magnitude]}`;
}

/** Fraction (0..1) of the soft budget already used. */
export function budgetFraction(usageBytes: number): number {
  if (usageBytes <= 0) return 0;
  return Math.min(1, usageBytes / STORAGE_BUDGET_BYTES);
}
