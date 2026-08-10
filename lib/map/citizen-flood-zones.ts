// ---------------------------------------------------------------------
// lib/map/citizen-flood-zones.ts — Phase 4 · Step 3 · Binary flood overlay.
//
// Citizens don't need water depth — they need "Am I in danger?". So the
// public map renders a BINARY picture: two large danger polygons styled
// red, and everything else is implicitly safe. There are no amber/yellow
// zones on the citizen map by design.
//
// Pure + SSR-safe: the generator takes a center (the citizen's resolved
// map view) and returns plain GeoJSON, so it is unit-tested here and the
// client component just feeds it the value from resolveCitizenMapView().
//
// Geometry rules (location-agnostic — same center always yields the same
// shapes via a seeded PRNG):
//   • Zone A — "primary" — is a large circle centred ON the citizen's
//     location, so their current position always reads as inside danger.
//   • Zone B — "satellite" — sits ~4–5 km to the south-west and gives the
//     map a second, believable red mass without swallowing any shelter
//     (shelter coordinates are all ≥ 3 km from the citizen's center).
// ---------------------------------------------------------------------

import { circle, destination } from "@turf/turf";
import type { FeatureCollection, Polygon } from "geojson";

/** Citizen flood zone properties — binary: a zone is always "danger". */
export type CitizenFloodZoneProperties = {
  zone: "danger";
};

export type CitizenFloodZones = FeatureCollection<Polygon, CitizenFloodZoneProperties>;

// Small deterministic PRNG so the geometry is stable per (lat,lng) seed,
// avoiding layout jitter on every render (same pattern as flood-geojson).
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate the two binary danger polygons for the citizen map.
 *
 * The primary zone is always centred on `centerLat/centerLng` with a
 * radius in [2.4, 2.9] km — large enough to visibly cover the user's
 * district, small enough to never reach the mock shelters (all ≥ 3 km
 * away). The satellite zone is a second large circle ~4.2–5 km to the
 * south-west so the map shows two distinct red masses.
 */
export function generateCitizenFloodZones(
  centerLat: number,
  centerLng: number,
): CitizenFloodZones {
  const seed = Math.floor(centerLat * 1000 + centerLng * 1000);

  // Primary zone — always contains the citizen's own position.
  const primaryRadiusKm = 2.4 + seeded(seed) * 0.5;
  const primary = circle([centerLng, centerLat], primaryRadiusKm, {
    units: "kilometers",
  });

  // Satellite zone — deterministic south-west blob, never near a shelter.
  const bearing = 240 + (seeded(seed + 1) - 0.5) * 20; // ~230–250°
  const satelliteDistKm = 4.2 + seeded(seed + 2) * 0.8;
  const satelliteCenter = destination(
    [centerLng, centerLat],
    satelliteDistKm,
    bearing,
    { units: "kilometers" },
  ).geometry?.coordinates as [number, number];
  const satelliteRadiusKm = 1.9 + seeded(seed + 3) * 0.5;
  const satellite = circle(satelliteCenter, satelliteRadiusKm, {
    units: "kilometers",
  });

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { zone: "danger" },
        geometry: primary.geometry as Polygon,
      },
      {
        type: "Feature",
        properties: { zone: "danger" },
        geometry: satellite.geometry as Polygon,
      },
    ],
  };
}
