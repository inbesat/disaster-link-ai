// ---------------------------------------------------------------------
// lib/map/citizen-navigation.test.ts — Phase 4 · Step 6 guidance generator.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { CITIZEN_SHELTERS } from "./citizen-shelters";
import { buildCitizenNavigation, type NavArrow } from "./citizen-navigation";

/** Default citizen location (Patna) — matches the demo district. */
const ORIGIN = { lat: 25.5941, lng: 85.1376 };

const VALID_ARROWS = new Set<NavArrow>([
  "up",
  "up-right",
  "right",
  "down-right",
  "down",
  "down-left",
  "left",
  "up-left",
  "arrived",
]);

describe("buildCitizenNavigation", () => {
  it("always ends with an arrival step naming the shelter", () => {
    for (const shelter of CITIZEN_SHELTERS) {
      const nav = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
      const last = nav.steps[nav.steps.length - 1];
      expect(last.arrow).toBe("arrived");
      expect(last.instruction).toContain(shelter.name);
    }
  });

  it("starts with a 'Head <direction> on <street>' compass instruction", () => {
    for (const shelter of CITIZEN_SHELTERS) {
      const nav = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
      expect(nav.steps[0].instruction).toMatch(/^Head (north|east|north-east|north-west) on .+$/);
      expect(nav.steps[0].distanceMeters).toBe(0);
    }
  });

  it("uses only valid arrow keys", () => {
    for (const shelter of CITIZEN_SHELTERS) {
      const nav = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
      for (const step of nav.steps) {
        expect(VALID_ARROWS.has(step.arrow)).toBe(true);
      }
    }
  });

  it("shrinks turn distances as the trip progresses", () => {
    for (const shelter of CITIZEN_SHELTERS) {
      const nav = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
      const turns = nav.steps.slice(1, -1).map((s) => s.distanceMeters);
      for (let i = 1; i < turns.length; i++) {
        expect(turns[i]).toBeLessThanOrEqual(turns[i - 1]);
      }
    }
  });

  it("derives a sane walking ETA and distance from the route", () => {
    for (const shelter of CITIZEN_SHELTERS) {
      const nav = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
      expect(nav.distanceKm).toBeGreaterThan(0);
      expect(nav.etaMinutes).toBeGreaterThanOrEqual(2);
      // 4.8 km/h walking — never less than the straight-line minimum.
      expect(nav.etaMinutes).toBeGreaterThanOrEqual(Math.floor((nav.distanceKm / 5) * 60) - 1);
    }
  });

  it("is deterministic for the same origin and shelter", () => {
    const shelter = CITIZEN_SHELTERS[0];
    const a = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
    const b = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
    expect(a.steps).toEqual(b.steps);
    expect(a.etaMinutes).toBe(b.etaMinutes);
    expect(a.distanceKm).toBe(b.distanceKm);
  });

  it("produces a walkable sequence for every mock shelter", () => {
    for (const shelter of CITIZEN_SHELTERS) {
      const nav = buildCitizenNavigation(ORIGIN.lat, ORIGIN.lng, shelter);
      expect(nav.steps.length).toBeGreaterThanOrEqual(4); // head out + 2–4 turns + arrival
    }
  });
});
