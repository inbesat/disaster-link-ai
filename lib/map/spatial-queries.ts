import { distance } from "@turf/distance";
import { point } from "@turf/helpers";

/**
 * A minimal shelter shape consumed by the nearest-available lookup.
 * Status is always the raw string; `distance_km` is injected on output.
 */
export type SpatialShelter = {
  id: string;
  name: string;
  district: string | null;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy: number;
  status: string;
  facilities: Record<string, boolean> | null;
  distance_km?: number;
};

/**
 * Find the `limit` closest shelters that still have space.
 *
 * - Filters out shelters where `status === "full"`.
 * - Computes the geodesic distance in kilometres from (targetLat, targetLng) to
 *   each remaining shelter using Turf's haversine distance.
 * - Returns them sorted closest-first, with `distance_km` injected.
 */
export function findNearestAvailableShelters(
  targetLat: number,
  targetLng: number,
  allShelters: SpatialShelter[],
  limit = 3,
): SpatialShelter[] {
  const origin = point([targetLng, targetLat]);

  return allShelters
    .filter((shelter) => shelter.status !== "full")
    .map((shelter) => ({
      ...shelter,
      distance_km: distance(origin, point([shelter.lng, shelter.lat]), {
        units: "kilometers",
      }),
    }))
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
    .slice(0, limit);
}
