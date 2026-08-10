// ---------------------------------------------------------------------
// lib/map/citizen-shelters.ts — Phase 4 · Step 4 · Mock shelters for the
// public map.
//
// Single edit point for the shelters drawn on the citizen map. Names and
// capacities mirror the Phase 2 NearbySheltersList so the map and the
// dashboard quick-list tell the same story (a full shelter on the list is
// a red "Do Not Go" marker on the map). One deliberate tweak: Riverside's
// occupancy is 108/150 (amber "Filling Up") rather than the list's 128/150
// so the map demonstrates all three capacity states — the static list has
// no amber example.
//
// Pure + SSR-safe: coordinates are explicit and helpers take plain inputs,
// so the component just feeds values in and tests can assert on them.
// ---------------------------------------------------------------------

import { haversineKm } from "@/lib/mock-data/hazard-zones";

/** Three-state capacity readout shown to the public. */
export type CitizenShelterStatus = "available" | "filling" | "full";

export type CitizenShelter = {
  id: string;
  name: string;
  /** Latitude / longitude (GeoJSON-friendly). */
  lat: number;
  lng: number;
  capacity: number;
  occupancy: number;
  /** Facility flags — rendered as chips on the bottom sheet. */
  medical: boolean;
  food: boolean;
};

/**
 * Mock shelters around the demo district (Patna). Coordinates keep every
 * shelter ≥ ~3 km from the citizen's default location — outside the
 * primary flood zone — so a safe (green) route exists to each of them.
 */
export const CITIZEN_SHELTERS: CitizenShelter[] = [
  {
    id: "shelter-central-hall",
    name: "Patna Central Community Hall",
    lat: 25.609,
    lng: 85.164,
    capacity: 100,
    occupancy: 45,
    medical: true,
    food: true,
  },
  {
    id: "shelter-riverside-school",
    name: "Riverside High School",
    lat: 25.561,
    lng: 85.166,
    capacity: 150,
    occupancy: 108,
    medical: true,
    food: false,
  },
  {
    id: "shelter-kankarbagh-stadium",
    name: "Kankarbagh Stadium Shelter",
    lat: 25.589,
    lng: 85.19,
    capacity: 250,
    occupancy: 92,
    medical: false,
    food: true,
  },
  {
    id: "shelter-danapur-camp",
    name: "Danapur Relief Camp",
    lat: 25.63,
    lng: 85.048,
    capacity: 450,
    occupancy: 450,
    medical: true,
    food: true,
  },
];

/** Occupancy as a 0–100 percentage (rounded). */
export function shelterOccupancyPct(
  shelter: Pick<CitizenShelter, "capacity" | "occupancy">,
): number {
  if (shelter.capacity <= 0) return 100;
  return Math.round((shelter.occupancy / shelter.capacity) * 100);
}

/**
 * Capacity status for the marker + sheet badge. Same thresholds as the
 * Phase 2 NearbySheltersList occupancy bar: ≥ 80 % is FULL ("Do Not Go"),
 * ≥ 50 % is filling up, below that is available.
 */
export function shelterStatus(
  shelter: Pick<CitizenShelter, "capacity" | "occupancy">,
): CitizenShelterStatus {
  const pct = shelterOccupancyPct(shelter);
  if (pct >= 80) return "full";
  if (pct >= 50) return "filling";
  return "available";
}

/** Great-circle distance in kilometres from a point to a shelter. */
export function shelterDistanceKm(
  shelter: Pick<CitizenShelter, "lat" | "lng">,
  fromLat: number,
  fromLng: number,
): number {
  return haversineKm(fromLat, fromLng, shelter.lat, shelter.lng);
}
