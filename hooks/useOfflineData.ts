"use client";

// ---------------------------------------------------------------------
// hooks/useOfflineData.ts — live access to the 48-hour offline cache.
//
// Reads the four core datasets for a district straight from the shared
// DisasterLinkDB (IndexedDB) via dexie-react-hooks' useLiveQuery, so any
// write from the sync engine (syncOfflineData / background sync / SW
// relay) re-renders subscribers automatically — no polling, no manual
// refresh. Rows outside the 48h window are filtered out on read. SSR-safe:
// the hook returns the `loading` placeholder until the client query runs.
// ---------------------------------------------------------------------

import { useLiveQuery } from "dexie-react-hooks";
import { getOfflineDb } from "@/lib/offline-sync/db";
import type { OfflineRecord } from "@/lib/offline-sync/types";

export interface OfflineDataResult {
  /** Cached predictions for the district (fresh within 48h). */
  predictions: Array<OfflineRecord<unknown>>;
  /** Cached alerts for the district (fresh within 48h). */
  alerts: Array<OfflineRecord<unknown>>;
  /** Cached shelters for the district (fresh within 48h). */
  shelters: Array<OfflineRecord<unknown>>;
  /** Cached resources for the district (fresh within 48h). */
  resources: Array<OfflineRecord<unknown>>;
  /** ISO timestamp of the newest cached row across all four (syncedAt). */
  syncedAt: string | null;
  /** False once the live query has resolved at least once. */
  loading: boolean;
  /** True when the district has any fresh cached data. */
  hasData: boolean;
}

const INITIAL: OfflineDataResult = {
  predictions: [],
  alerts: [],
  shelters: [],
  resources: [],
  syncedAt: null,
  loading: true,
  hasData: false,
};

/** Keeps only rows still inside the 48h offline window. */
function freshRows(rows: Array<OfflineRecord<unknown>>): Array<OfflineRecord<unknown>> {
  const now = Date.now();
  return rows.filter((row) => new Date(row.expiresAt).getTime() >= now);
}

/** Newest cachedAt across a set of rows, or null when empty. */
function newestSyncedAt(rows: Array<OfflineRecord<unknown>>[]): string | null {
  let latest: string | null = null;
  for (const group of rows) {
    for (const row of group) {
      if (!latest || row.cachedAt > latest) latest = row.cachedAt;
    }
  }
  return latest;
}

/**
 * Live view of the offline cache for one district. `district` is part of
 * the query key, so switching districts re-queries automatically.
 */
export function useOfflineData(district: string): OfflineDataResult {
  const snapshot = useLiveQuery(
    async (): Promise<OfflineDataResult> => {
      const db = getOfflineDb();
      const [predictions, alerts, shelters, resources] = await Promise.all([
        db.predictions.where("district").equals(district).toArray(),
        db.alerts.where("district").equals(district).toArray(),
        db.shelters.where("district").equals(district).toArray(),
        db.resources.where("district").equals(district).toArray(),
      ]);

      const fresh = {
        predictions: freshRows(predictions),
        alerts: freshRows(alerts),
        shelters: freshRows(shelters),
        resources: freshRows(resources),
      };

      return {
        ...fresh,
        syncedAt: newestSyncedAt([
          fresh.predictions,
          fresh.alerts,
          fresh.shelters,
          fresh.resources,
        ]),
        loading: false,
        hasData:
          fresh.predictions.length +
            fresh.alerts.length +
            fresh.shelters.length +
            fresh.resources.length >
          0,
      };
    },
    [district],
  );

  return snapshot ?? INITIAL;
}

export default useOfflineData;
