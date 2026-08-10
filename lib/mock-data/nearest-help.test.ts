// ---------------------------------------------------------------------
// lib/mock-data/nearest-help.test.ts — Phase 5 · Step 6 distances.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  NEAREST_HELP_PLACES,
  nearestHelpList,
} from "./nearest-help";

/** Default citizen location (Patna) — matches the demo district. */
const ORIGIN = { lat: 25.5941, lng: 85.1376 };

describe("NEAREST_HELP_PLACES", () => {
  it("has exactly the three spec'd entities with unique ids", () => {
    const ids = NEAREST_HELP_PLACES.map((p) => p.id);
    expect(ids).toEqual(["police", "hospital", "camp"]);
    expect(new Set(ids).size).toBe(3);
    expect(NEAREST_HELP_PLACES.every((p) => p.name.trim() !== "")).toBe(true);
  });
});

describe("nearestHelpList", () => {
  it("returns every entity with a positive distance", () => {
    const list = nearestHelpList(ORIGIN.lat, ORIGIN.lng);
    expect(list).toHaveLength(3);
    for (const entry of list) {
      expect(entry.distanceKm).toBeGreaterThan(0);
    }
  });

  it("sorts nearest first", () => {
    const list = nearestHelpList(ORIGIN.lat, ORIGIN.lng);
    for (let i = 1; i < list.length; i++) {
      expect(list[i].distanceKm).toBeGreaterThanOrEqual(list[i - 1].distanceKm);
    }
  });

  it("lands at believable walking distances from the demo citizen", () => {
    const list = nearestHelpList(ORIGIN.lat, ORIGIN.lng);
    expect(list[0].distanceKm).toBeLessThan(1.5); // police is closest
    expect(list[2].distanceKm).toBeLessThan(3); // all within ~3 km
  });

  it("is deterministic for the same origin", () => {
    const a = nearestHelpList(ORIGIN.lat, ORIGIN.lng);
    const b = nearestHelpList(ORIGIN.lat, ORIGIN.lng);
    expect(a).toEqual(b);
  });
});
