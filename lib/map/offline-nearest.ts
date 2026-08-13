// ---------------------------------------------------------------------
// lib/map/offline-nearest.ts — Offline-First Architecture · Phase 8
// GPS-based "nearest resource" finder that works fully offline.
//
// Reads the cached `resources` rows from IndexedDB (db.resources, filled by
// the Phase 2 offline sync), resolves the user's GPS position via the
// device geolocation API (works without a network — GPS is hardware) and
// ranks the nearest `limit` resources by haversine distance.
//
// Pure core (rankCachedResources) is injectable so tests assert exact
// distances without a browser; the hook wires IndexedDB + geolocation.
// ---------------------------------------------------------------------

import { haversineKm } from "@/lib/mock-data/hazard-zones";

/** A resource row as cached by the offline sync engine. */
export interface CachedResource {
  id: string;
  name?: string;
  type?: string;
  lat: number;
  lng: number;
  distance_km?: number;
  /** Capacity occupancy info when present ("available" / "full"). */
  status?: string;
  address?: string;
}

/** Extract a CachedResource from an OfflineRecord's `data` payload. */
export function toCachedResource(data: unknown): CachedResource | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const lat = Number(d.lat ?? d.latitude);
  const lng = Number(d.lng ?? d.longitude ?? d.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id: String(d.id ?? d.name ?? `${lat},${lng}`),
    name: typeof d.name === "string" ? d.name : undefined,
    type: typeof d.type === "string" ? d.type : undefined,
    lat,
    lng,
    status: typeof d.status === "string" ? d.status : undefined,
    address: typeof d.address === "string" ? d.address : undefined,
  };
}

/**
 * Ranks cached resources by distance from the user's position, closest
 * first. `limit` controls the returned slice (default 5). Pure + sync.
 */
export function rankCachedResources(
  resources: CachedResource[],
  targetLat: number,
  targetLng: number,
  limit = 5,
): CachedResource[] {
  return resources
    .map((resource) => ({
      ...resource,
      distance_km: haversineKm(targetLat, targetLng, resource.lat, resource.lng),
    }))
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
    .slice(0, limit);
}

/** A resolved GPS position (lat/lng) or null when unavailable/denied. */
export interface GpsPosition {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

/** Browser geolocation — injectable for tests. */
export type GeolocateFn = () => Promise<GpsPosition>;

/**
 * Default geolocation: the device GPS works offline (hardware), so this is
 * exactly what the offline finder relies on. Falls back to the district
 * centroid passed in when geolocation is denied/unavailable.
 */
export function getGpsPosition(): Promise<GpsPosition> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ lat: 0, lng: 0 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        }),
      () => resolve({ lat: 0, lng: 0 }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
    );
  });
}

export default rankCachedResources;
