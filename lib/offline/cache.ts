// ---------------------------------------------------------------------
// lib/offline/cache.ts — Phase 1 · Step 10 · Offline route cache.
//
// When the cell network dies, the citizen map must still answer the only
// question that matters: "which way do I go?". This module pre-builds and
// persists a small, deterministic snapshot the moment the app is online:
//
//   • the 5 nearest shelters (same CITIZEN_SHELTERS the map draws),
//   • the help-center directory (HELP_CENTERS), and
//   • a pre-computed mock evacuation route geometry to each cached shelter.
//
// Nothing here touches the network and nothing is stored on flaky state —
// just a versioned localStorage blob under a single key with a 24-hour
// freshness window. SSR-safe: every accessor guards on the environment, so
// the build and unit tests never blow up on missing `window`.
//
// PublicMap reads this cache to render shelter markers / route lines while
// offline instead of showing an empty map.
// ---------------------------------------------------------------------

import { generateCitizenFloodZones, type CitizenFloodZones } from "@/lib/map/citizen-flood-zones";
import { buildCitizenEvacuationRoute, type CitizenRouteSegment } from "@/lib/map/citizen-evacuation-route";
import { CITIZEN_SHELTERS, shelterDistanceKm, type CitizenShelter } from "@/lib/map/citizen-shelters";
import { HELP_CENTERS, type HelpCenter } from "@/lib/mock-data/help-centers";

/** Single localStorage key for the whole offline snapshot. */
export const OFFLINE_CACHE_KEY = "drip:offline-route-cache";

/** A cache older than 24 hours is treated as stale (rebuilt when online). */
export const OFFLINE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** How many shelters ship in one cache snapshot. */
export const OFFLINE_SHELTER_LIMIT = 4;

export type OfflineRouteCache = {
  /** Bump when the cached shape changes (v1). */
  version: 1;
  /** Epoch-ms timestamp of when the snapshot was written. */
  savedAt: number;
  /** The centre (citizen resolve view) the routes were generated from. */
  center: { lat: number; lng: number };
  /** Nearest OFFLINE_SHELTER_LIMIT shelters, sorted by distance. */
  shelters: CitizenShelter[];
  /** The full help-center directory. */
  centers: HelpCenter[];
  /** Mock evacuation route geometry per cached shelter id. */
  routes: Record<string, CitizenRouteSegment[]>;
};

/**
 * Build a fresh offline snapshot for a citizen map centre. `zones` default
 * to the same binary danger polygons drawCitizen-resolved view would show,
 * so the cached lines match the online colours exactly.
 */
export function buildOfflineRouteCache(
  centerLat: number,
  centerLng: number,
  zones: CitizenFloodZones = generateCitizenFloodZones(centerLat, centerLng),
): OfflineRouteCache {
  const nearest = [...CITIZEN_SHELTERS]
    .sort(
      (a, b) =>
        shelterDistanceKm(a, centerLat, centerLng) -
        shelterDistanceKm(b, centerLat, centerLng),
    )
    .slice(0, OFFLINE_SHELTER_LIMIT);

  const routes: Record<string, CitizenRouteSegment[]> = {};
  for (const shelter of nearest) {
    routes[shelter.id] = buildCitizenEvacuationRoute(
      centerLat,
      centerLng,
      shelter.lat,
      shelter.lng,
      zones,
    ).features;
  }

  return {
    version: 1,
    savedAt: Date.now(),
    center: { lat: centerLat, lng: centerLng },
    shelters: nearest,
    centers: HELP_CENTERS,
    routes,
  };
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Persist the snapshot. Returns false (ignored) when storage is absent. */
export function saveOfflineRouteCache(cache: OfflineRouteCache): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
    return true;
  } catch {
    return false;
  }
}

/** Load the snapshot, or null when absent / corrupt / wrong version. */
export function loadOfflineRouteCache(): OfflineRouteCache | null {
  if (!hasStorage()) return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(OFFLINE_CACHE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<OfflineRouteCache>;
    if (!parsed || parsed.version !== 1) return null;
    if (typeof parsed.savedAt !== "number") return null;
    if (!Array.isArray(parsed.shelters) || !Array.isArray(parsed.centers)) return null;
    if (!parsed.routes || typeof parsed.routes !== "object") return null;
    return parsed as OfflineRouteCache;
  } catch {
    return null;
  }
}

/** A snapshot within the 24 h freshness window. */
export function isOfflineCacheFresh(
  cache: OfflineRouteCache | null,
  now: number = Date.now(),
): boolean {
  if (!cache) return false;
  if (typeof cache.savedAt !== "number") return false;
  return now - cache.savedAt <= OFFLINE_CACHE_MAX_AGE_MS;
}