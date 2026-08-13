"use client";

// ---------------------------------------------------------------------
// hooks/useOfflineNearestResources.ts — Offline-First Architecture · Phase 8
// GPS-based nearest-resource finder for the offline map. Reads the cached
// `resources` rows from IndexedDB, resolves GPS (works offline — GPS is
// hardware), and ranks the nearest `limit` resources by haversine distance.
//
//   const { nearest, gps, loading, refresh } = useOfflineNearestResources();
//
// `refresh()` re-resolves the position (call after "use my location").
// Injectables (db, geolocate) keep the hook testable without a browser.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState, useCallback } from "react";
import { getOfflineDb } from "@/lib/offline-sync/db";
import {
  rankCachedResources,
  toCachedResource,
  getGpsPosition,
  type CachedResource,
  type GpsPosition,
  type GeolocateFn,
} from "@/lib/map/offline-nearest";

export interface OfflineNearestState {
  nearest: CachedResource[];
  gps: GpsPosition | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseOfflineNearestOptions {
  limit?: number;
  db?: ReturnType<typeof getOfflineDb> | null;
  geolocate?: GeolocateFn;
  /** Disable auto-run; only load on refresh() (used by the map button). */
  manual?: boolean;
}

export function useOfflineNearestResources(
  options: UseOfflineNearestOptions = {},
): OfflineNearestState {
  const { limit = 5, db = typeof indexedDB === "undefined" ? null : getOfflineDb(), geolocate = getGpsPosition, manual = false } = options;
  const [nearest, setNearest] = useState<CachedResource[]>([]);
  const [gps, setGps] = useState<GpsPosition | null>(null);
  const [loading, setLoading] = useState<boolean>(!manual);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!db) {
        setError("Offline database unavailable.");
        setNearest([]);
        setGps(null);
        return;
      }
      const [position, records] = await Promise.all([geolocate(), db.resources.toArray()]);
      const gpsValid = Number.isFinite(position.lat) && Number.isFinite(position.lng) && (position.lat !== 0 || position.lng !== 0);
      setGps(gpsValid ? position : null);
      const resources = records
        .map((record) => toCachedResource(record.data))
        .filter((r): r is CachedResource => r !== null);
      if (!gpsValid) {
        setNearest([]);
        setError("Location unavailable — enable GPS to find nearby resources.");
        return;
      }
      setNearest(rankCachedResources(resources, position.lat, position.lng, limit));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to read cached resources.");
    } finally {
      setLoading(false);
    }
  }, [db, geolocate, limit]);

  useEffect(() => {
    if (!manual) void run();
  }, [run, manual]);

  return useMemo(
    () => ({ nearest, gps, loading, error, refresh: run }),
    [nearest, gps, loading, error, run],
  );
}

export default useOfflineNearestResources;
