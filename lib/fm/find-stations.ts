// ---------------------------------------------------------------------
// lib/fm/find-stations.ts — Phase 26 · FM Radio Emergency Broadcasting
//
// Geospatial "which FM stations cover this disaster zone" lookups.
//
// The source of truth for coverage is the PostGIS `coverage_area`
// geography column (auto-computed from lat/lng + coverage_radius_km by
// the fm_stations_compute_coverage trigger). This module resolves it in
// JS with a turf great-circle distance fallback so the lookup works even
// before PostGIS/Postgres is reachable (hackathon demo path) — and its
// pure function `rankStationsByCoverage` is unit-tested.
//
// Priority ordering (regulatory context): AIR stations first (national
// emergency backbone + mandatory EWS broadcast obligation), then private
// stations by reach (larger coverage = higher reach), then community.
// ---------------------------------------------------------------------

import { distance } from "@turf/distance";
import { point } from "@turf/helpers";
import { circle } from "@turf/circle";
import type { Feature, Polygon } from "geojson";

/** The FM station shape consumed by the coverage lookup. */
export type FmStationLike = {
  id: string;
  name: string;
  frequency: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  coverageRadiusKm: number;
  type: string; // private | air | community
  rdsEnabled: boolean;
  emergencyApiEndpoint: string | null;
  emergencyContactPhone: string | null;
  isActive?: boolean;
  distance_km?: number;
};

/** Broadcast tier priority — AIR outranks private/community for emergencies. */
const TYPE_PRIORITY: Record<string, number> = {
  air: 0,
  private: 1,
  community: 2,
};

/**
 * Sort stations for an emergency broadcast: closest first, AIR stations
 * before private before community (tie-break by coverage reach). Mutates
 * nothing; returns a new array.
 */
export function rankStationsByCoverage(
  stations: FmStationLike[],
): FmStationLike[] {
  return [...stations].sort((a, b) => {
    const tierDiff =
      (TYPE_PRIORITY[a.type] ?? 2) - (TYPE_PRIORITY[b.type] ?? 2);
    if (tierDiff !== 0) return tierDiff;
    const dA = a.distance_km ?? Number.POSITIVE_INFINITY;
    const dB = b.distance_km ?? Number.POSITIVE_INFINITY;
    if (dA !== dB) return dA - dB;
    return b.coverageRadiusKm - a.coverageRadiusKm;
  });
}

/**
 * Find every station whose coverage radius reaches (targetLat, targetLng),
 * using the geodesic great-circle distance (haversine via turf).
 *
 * - Filters out inactive stations.
 * - Stations without coords can never match (they carry no geometry).
 * - Returns ranked (rankStationsByCoverage) with `distance_km` injected.
 */
export function findStationsInRadius(
  targetLat: number,
  targetLng: number,
  allStations: FmStationLike[],
  radiusKm = 50,
): FmStationLike[] {
  const origin = point([targetLng, targetLat]);

  const matching = allStations
    .filter((s) => s.isActive !== false)
    .filter((s) => s.lat !== null && s.lng !== null)
    .map((s) => {
      const d = distance(origin, point([s.lng as number, s.lat as number]), {
        units: "kilometers",
      });
      return { ...s, distance_km: d };
    })
    .filter((s) => (s.distance_km ?? Infinity) <= (s.coverageRadiusKm ?? radiusKm));

  return rankStationsByCoverage(matching);
}

/**
 * Generate an approximate coverage polygon for a station (GeoJSON Polygon
 * in [lng, lat] order) for drawing coverage circles on the admin map.
 * Uses turf's geodesic circle (64 segments — smooth enough to eyeball).
 */
export function coverageCircleGeoJSON(
  lat: number,
  lng: number,
  radiusKm: number,
): Feature<Polygon> {
  return circle([lng, lat], Math.max(radiusKm, 1), {
    units: "kilometers",
    steps: 64,
  }) as Feature<Polygon>;
}
