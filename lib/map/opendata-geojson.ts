// ---------------------------------------------------------------------
// lib/map/opendata-geojson.ts — Step 10 · Open Data Export (GeoJSON)
//
// Builds the NGO-facing FeatureCollection from ALREADY-SANITIZED shelter
// and alert rows (the route passes them through the privacy scrubber
// first). Shelters become Point features; alerts have no coordinates in
// the schema, so they are emitted as valid GeoJSON features with a null
// geometry (spec-compliant) — the payload itself is the data.
//
// Pure + SSR-safe so it can be unit-tested in isolation.
// ---------------------------------------------------------------------

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { PublicSafeAlert, PublicSafeShelter } from "@/lib/security/sanitize";

/** A FeatureCollection mixing Point shelters and null-geometry alerts. */
export type OpenDataCollection = FeatureCollection<
  Geometry | null,
  Record<string, unknown>
>;

/**
 * Convert sanitized shelters + alerts into a GeoJSON FeatureCollection.
 * Longitude is first in each Point (GeoJSON coordinate order), as with
 * every other map layer in this codebase.
 */
export function buildOpenDataFeatureCollection(
  shelters: PublicSafeShelter[],
  alerts: PublicSafeAlert[],
): OpenDataCollection {
  const features: Array<Feature<Geometry | null, Record<string, unknown>>> = [
    ...shelters.map((shelter) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [shelter.lng, shelter.lat],
      },
      properties: {
        kind: "shelter",
        id: shelter.id,
        name: shelter.name,
        district: shelter.district,
        capacity: shelter.capacity,
        current_occupancy: shelter.currentOccupancy,
        status: shelter.status,
        facilities: shelter.facilities ?? null,
        updated_at: shelter.updatedAt?.toISOString() ?? null,
      },
    })),
    ...alerts.map((alert) => ({
      type: "Feature" as const,
      geometry: null,
      properties: {
        kind: "alert",
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        district: alert.district,
        sent_at: alert.sentAt.toISOString(),
      },
    })),
  ];

  return { type: "FeatureCollection", features };
}
