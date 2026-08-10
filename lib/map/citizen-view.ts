// ---------------------------------------------------------------------
// lib/map/citizen-view.ts — Phase 4 · Steps 1–2 · "Where do I go?"
//
// Resolves the citizen's saved location (localStorage `citizen_location`,
// written by the Phase 1 location setup) into the initial camera view for
// the minimalist public map. Pure + SSR-safe: the resolver takes the
// already-read location (or null) and returns plain coordinates, so it is
// unit-tested here and the client component just feeds it the value from
// readCitizenLocation().
//
// District centroids come from HAZARD_ZONES (lib/mock-data/
// hazard-zones.ts) — the same source of truth the SafetyHero geo-fence
// uses — so a manual location always lands on the same district its risk
// status was calculated from.
// ---------------------------------------------------------------------

import { HAZARD_ZONES, type CitizenLocation } from "@/lib/mock-data/hazard-zones";

export type CitizenMapView = {
  center: { lat: number; lng: number };
  zoom: number;
  /** Human label for the on-map chip, e.g. "Kankarbagh, Patna". */
  label: string;
};

/** Where the map opens when nothing is saved — Patna, the demo base. */
export const CITIZEN_MAP_DEFAULTS: CitizenMapView = {
  center: { lat: 25.5941, lng: 85.1376 },
  zoom: 12,
  label: "Patna",
};

export function resolveCitizenMapView(location: CitizenLocation | null): CitizenMapView {
  if (!location) return CITIZEN_MAP_DEFAULTS;

  if (location.type === "gps") {
    return {
      center: { lat: location.lat, lng: location.lng },
      zoom: 14, // street level — "where am I right now"
      label: "Your location",
    };
  }

  const zone = HAZARD_ZONES.find(
    (z) => z.district.toLowerCase() === location.district.toLowerCase(),
  );
  if (zone) {
    return {
      center: { lat: zone.lat, lng: zone.lng },
      zoom: 11, // district level — "which district am I in"
      label: `${location.village}, ${location.district}`,
    };
  }

  return CITIZEN_MAP_DEFAULTS;
}
