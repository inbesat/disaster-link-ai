// ---------------------------------------------------------------------
// lib/map/citizen-evacuation-route.ts — Phase 4 · Step 5 · Evacuation
// route from the citizen's location to a shelter.
//
// Generates a mock, deterministic route (a gently curved polyline — no
// network call, so it works offline and never hangs mid-panic) and splits
// it into per-segment LineString features. Each segment carries a
// `flooded` boolean computed from the binary danger zones, so the map can
// style safe segments green and flooded segments red-with-dashes.
//
// Pure + SSR-safe: geometry is seeded from the endpoints, and flooding is
// decided by turf's point-in-polygon against the citizen flood zones.
// ---------------------------------------------------------------------

import { booleanPointInPolygon } from "@turf/turf";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";

export type CitizenRouteSegment = Feature<LineString, { flooded: boolean }>;

export type CitizenEvacuationRoute = FeatureCollection<LineString, { flooded: boolean }>;

/** Number of route segments — 5 gives a believable road-like curve. */
const SEGMENTS = 5;

// Small deterministic PRNG (same pattern as flood-geojson / gis-data).
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Build the mock evacuation route.
 *
 * The polyline starts at the citizen's location and ends at the shelter,
 * with seeded perpendicular wiggle so it reads as a road rather than a
 * straight line. Each segment is flooded when its midpoint falls inside a
 * danger zone — so a citizen starting inside the flood picks up red
 * dashes until they clear the zone, then green to safety.
 */
export function buildCitizenEvacuationRoute(
  originLat: number,
  originLng: number,
  destinationLat: number,
  destinationLng: number,
  dangerZones: FeatureCollection<Polygon>,
): CitizenEvacuationRoute {
  const seed = Math.floor((originLat + destinationLat) * 1000 + (originLng + destinationLng) * 1000);
  const lngScale = Math.cos((originLat * Math.PI) / 180) || 1;

  // Waypoints: origin → seeded curve → destination. Coordinates are
  // [lng, lat] per the GeoJSON spec.
  const waypoints: [number, number][] = [[originLng, originLat]];
  const baseAngle = Math.atan2(destinationLng - originLng, destinationLat - originLat);

  for (let i = 1; i < SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const baseLat = originLat + (destinationLat - originLat) * t;
    const baseLng = originLng + (destinationLng - originLng) * t;
    // Perpendicular wiggle (±~0.25 km) keeps the route road-like.
    const jitterKm = (seeded(seed + i) - 0.5) * 0.5;
    const dLat = (-Math.sin(baseAngle) * jitterKm) / 111;
    const dLng = (Math.cos(baseAngle) * jitterKm) / (111 * lngScale);
    waypoints.push([baseLng + dLng, baseLat + dLat]);
  }
  waypoints.push([destinationLng, destinationLat]);

  const features: CitizenRouteSegment[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lng1, lat1] = waypoints[i];
    const [lng2, lat2] = waypoints[i + 1];
    const flooded = dangerZones.features.some((zone) =>
      booleanPointInPolygon([(lng1 + lng2) / 2, (lat1 + lat2) / 2], zone),
    );
    features.push({
      type: "Feature",
      properties: { flooded },
      geometry: {
        type: "LineString",
        coordinates: [waypoints[i], waypoints[i + 1]],
      },
    });
  }

  return { type: "FeatureCollection", features };
}
