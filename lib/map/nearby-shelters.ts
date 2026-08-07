import {
  findNearestAvailableShelters,
  type SpatialShelter,
} from "@/lib/map/spatial-queries";

/**
 * Nearest AVAILABLE shelters, PostGIS-first.
 *
 * Calls /api/shelters/nearest (real ST_Distance / GiST `<->` ordering). If the
 * PostGIS column is unseeded/NULL (returns empty) it gracefully falls back to
 * the client-side Turf haversine implementation over the supplied array.
 */
export async function findNearestShelters(
  targetLat: number,
  targetLng: number,
  allShelters: SpatialShelter[],
  limit = 3,
): Promise<SpatialShelter[]> {
  try {
    const response = await fetch(
      `/api/shelters/nearest?lat=${targetLat}&lng=${targetLng}&limit=${limit}`,
      { cache: "no-store" },
    );
    if (response.ok) {
      const data = (await response.json()) as { shelters?: SpatialShelter[] };
      if (data.shelters && data.shelters.length > 0) {
        return data.shelters;
      }
    }
  } catch {
    // fall through to the client-side implementation
  }

  return findNearestAvailableShelters(targetLat, targetLng, allShelters, limit);
}
