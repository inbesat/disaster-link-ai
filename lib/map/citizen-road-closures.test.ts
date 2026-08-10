// ---------------------------------------------------------------------
// lib/map/citizen-road-closures.test.ts — Phase 4 · Step 7 closures.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { CITIZEN_SHELTERS } from "./citizen-shelters";
import { CITIZEN_ROAD_CLOSURES } from "./citizen-road-closures";
import { haversineKm } from "@/lib/mock-data/hazard-zones";

/** Bounding box around the demo district (Patna). */
const BBOX = { minLat: 25.54, maxLat: 25.66, minLng: 85.03, maxLng: 85.21 };

describe("CITIZEN_ROAD_CLOSURES", () => {
  it("contains at least two closures so the map reads clearly", () => {
    expect(CITIZEN_ROAD_CLOSURES.length).toBeGreaterThanOrEqual(2);
  });

  it("has unique ids", () => {
    const ids = CITIZEN_ROAD_CLOSURES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("marks every closure as active and gives it a reason", () => {
    for (const closure of CITIZEN_ROAD_CLOSURES) {
      expect(closure.isActive).toBe(true);
      expect(closure.reason.trim().length).toBeGreaterThan(0);
    }
  });

  it("sits inside the demo district bounding box", () => {
    for (const closure of CITIZEN_ROAD_CLOSURES) {
      expect(closure.lat).toBeGreaterThan(BBOX.minLat);
      expect(closure.lat).toBeLessThan(BBOX.maxLat);
      expect(closure.lng).toBeGreaterThan(BBOX.minLng);
      expect(closure.lng).toBeLessThan(BBOX.maxLng);
    }
  });

  it("never sits on top of a shelter — a barricade blocks a route segment, not the destination", () => {
    // Match the routing.ts convention (closure within ~150 m of a point
    // counts as blocking it) with generous slack: > 300 m from every shelter.
    for (const closure of CITIZEN_ROAD_CLOSURES) {
      for (const shelter of CITIZEN_SHELTERS) {
        const km = haversineKm(closure.lat, closure.lng, shelter.lat, shelter.lng);
        expect(km).toBeGreaterThan(0.3);
      }
    }
  });
});
