// ---------------------------------------------------------------------
// lib/map/citizen-navigation.ts — Phase 4 · Step 6 · Turn-by-turn guidance.
//
// Pure + SSR-safe generator for the mock turn-by-turn overlay. Since the
// Phase 4 routes are generated (no network call), the guidance steps are
// generated the same way: seeded from the origin + shelter so the same
// trip always shows the same maneuvers.
//
// The returned steps are consumed in order by the TurnByTurnNav overlay:
//   • Step 0 — "Head <compass direction> on <street>" (no turn yet).
//   • Middle steps — "Turn left/right in <meters> meters", with the
//     meters shrinking as the trip progresses.
//   • Final step — "Arrive at <shelter name>" (arrow = "arrived").
//
// ETA is a walking estimate (4.8 km/h) derived from the same haversine
// distance the shelter bottom sheet shows, so the sheet and the overlay
// always agree.
// ---------------------------------------------------------------------

import type { CitizenShelter } from "./citizen-shelters";
import { shelterDistanceKm } from "./citizen-shelters";

/**
 * Compass keys for the big directional arrow. `arrived` is the terminal
 * state (rendered as a flag / arrival marker rather than a turn arrow).
 */
export type NavArrow =
  | "up"
  | "up-right"
  | "right"
  | "down-right"
  | "down"
  | "down-left"
  | "left"
  | "up-left"
  | "arrived";

export type CitizenNavStep = {
  /** High-contrast instruction, e.g. "Turn left in 200 meters". */
  instruction: string;
  /** Which way the big arrow points for this maneuver. */
  arrow: NavArrow;
  /** Meters until the next maneuver (0 for the "head out" and arrival steps). */
  distanceMeters: number;
};

export type CitizenNavigation = {
  /** Maneuvers in order — the last one is always the arrival step. */
  steps: CitizenNavStep[];
  /** Walking ETA in whole minutes. */
  etaMinutes: number;
  /** Total route distance in km (same value the shelter sheet shows). */
  distanceKm: number;
};

/** Small deterministic PRNG (same pattern as flood-geojson / gis-data). */
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Street-name pool so instructions read like a real city, not a polygon. */
const STREETS = [
  "Ashok Rajpath",
  "Bailey Road",
  "Frazer Road",
  "Boring Road",
  "Exhibition Road",
];

/** Compass directions the first step may send the citizen off in. */
const HEAD_ARROWS = ["up", "up-right", "right", "up-left"] as const;

const COMPASS_LABEL: Record<(typeof HEAD_ARROWS)[number], string> = {
  up: "north",
  "up-right": "north-east",
  right: "east",
  "up-left": "north-west",
};

/** Walking speed used for the ETA (km/h) — brisk but realistic. */
const WALKING_SPEED_KPH = 4.8;

/**
 * Build the mock guidance for a trip from the citizen's location to a
 * shelter. Deterministic per (origin, shelter) pair.
 */
export function buildCitizenNavigation(
  originLat: number,
  originLng: number,
  shelter: CitizenShelter,
): CitizenNavigation {
  const seed = Math.floor((originLat + shelter.lat) * 1000 + (originLng + shelter.lng) * 1000);

  const distanceKm = shelterDistanceKm(shelter, originLat, originLng);
  const etaMinutes = Math.max(2, Math.round((distanceKm / WALKING_SPEED_KPH) * 60));

  // 2–4 maneuvers between "head out" and arrival.
  const maneuverCount = 2 + Math.floor(seeded(seed + 2) * 3);

  const steps: CitizenNavStep[] = [];
  const headArrow = HEAD_ARROWS[Math.floor(seeded(seed) * HEAD_ARROWS.length)];
  const street = STREETS[Math.floor(seeded(seed + 1) * STREETS.length)];
  steps.push({
    instruction: `Head ${COMPASS_LABEL[headArrow]} on ${street}`,
    arrow: headArrow,
    distanceMeters: 0,
  });

  const totalMeters = distanceKm * 1000;
  for (let i = 0; i < maneuverCount; i++) {
    // Turn distances shrink as the trip progresses: 55% → 43% → 31% → 19%.
    const ratio = Math.max(0.19, 0.55 - i * 0.12);
    const meters = Math.max(40, Math.round(((totalMeters * ratio) / 10) * 10));
    const turn = seeded(seed + 10 + i) >= 0.5 ? "right" : "left";
    steps.push({
      instruction: `Turn ${turn} in ${meters} meters`,
      arrow: turn,
      distanceMeters: meters,
    });
  }

  steps.push({
    instruction: `Arrive at ${shelter.name}`,
    arrow: "arrived",
    distanceMeters: 0,
  });

  return { steps, etaMinutes, distanceKm };
}
