// ---------------------------------------------------------------------
// lib/map/citizen-family-locations.ts — Phase 4 · Step 8 · "Find My
// Family" map positions.
//
// The Phase 1 family setup only saves `{ name, phone }` — there is no
// realtime presence backend in the demo — so the map layer assigns each
// member a deterministic MOCK position within ~2.5 km of the citizen's
// saved location. Same seeded-PRNG pattern as the flood zones / routes,
// so a given citizen always sees the same family layout, and swapping in
// real GPS telemetry later means replacing this one function.
// ---------------------------------------------------------------------

import type { FamilyContactWithStatus } from "@/lib/mock-data/family-contacts";

export type FamilyMemberWithLocation = FamilyContactWithStatus & {
  lat: number;
  lng: number;
};

/** Small deterministic PRNG (same pattern as flood-geojson / gis-data). */
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/**
 * Deterministic position for family member `index` relative to the
 * citizen's location. Members fan out on distinct bearings (79° apart)
 * at 0.6–2.5 km so they read as a believable "family circle" and never
 * stack on top of each other or on the citizen's own pin.
 */
export function familyMemberLocation(
  centerLat: number,
  centerLng: number,
  index: number,
): { lat: number; lng: number } {
  const seed = Math.floor(centerLat * 1000 + centerLng * 1000) + index * 7;
  const bearingDeg = index * 79 + Math.floor(seeded(seed) * 40);
  const bearingRad = (bearingDeg * Math.PI) / 180;
  const distKm = 0.6 + seeded(seed + 1) * 1.9;
  const lngScale = Math.cos((centerLat * Math.PI) / 180) || 1;
  const dLat = (distKm * Math.cos(bearingRad)) / 111;
  const dLng = (distKm * Math.sin(bearingRad)) / (111 * lngScale);
  return { lat: centerLat + dLat, lng: centerLng + dLng };
}

/**
 * Attach a mock location to every saved family member, in order. Pure and
 * deterministic — same input always yields the same layout.
 */
export function withFamilyLocations(
  contacts: FamilyContactWithStatus[],
  centerLat: number,
  centerLng: number,
): FamilyMemberWithLocation[] {
  return contacts.map((contact, index) => ({
    ...contact,
    ...familyMemberLocation(centerLat, centerLng, index),
  }));
}
