// ---------------------------------------------------------------------
// lib/mock-data/nearest-help.ts — Phase 5 · Step 6 · "Nearest Help"
// auto-finder data.
//
// While an SOS is active, the dashboard shows a Help Nearby card with
// the three closest help entities. Coordinates are hand-placed around
// the demo district (Patna) so the computed distances land at believable
// walking ranges (~0.8 / ~1.2 / ~2.0 km from the default citizen
// location — the same haversine helper the shelters use).
//
// Pure + SSR-safe: the distances are computed from the citizen's saved
// location at render time, sorted ascending, so the card always lists
// the nearest help first.
// ---------------------------------------------------------------------

import { haversineKm } from "./hazard-zones";

export type NearestHelpPlace = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

/** Single edit point for the help entities. */
export const NEAREST_HELP_PLACES: NearestHelpPlace[] = [
  { id: "police", name: "Police Station", lat: 25.6005, lng: 85.1415 },
  { id: "hospital", name: "Govt Hospital", lat: 25.602, lng: 85.13 },
  { id: "camp", name: "Relief Camp", lat: 25.599, lng: 85.1575 },
];

export type NearestHelpEntry = NearestHelpPlace & {
  /** Great-circle distance from the citizen, in km. */
  distanceKm: number;
};

/** All help entities with their distance from the citizen, nearest first. */
export function nearestHelpList(
  citizenLat: number,
  citizenLng: number,
): NearestHelpEntry[] {
  return NEAREST_HELP_PLACES.map((place) => ({
    ...place,
    distanceKm: haversineKm(citizenLat, citizenLng, place.lat, place.lng),
  })).sort((a, b) => a.distanceKm - b.distanceKm);
}
