// ---------------------------------------------------------------------
// lib/offline/step-directions.test.ts — Phase 1 · Step 10 · Offline
// turn-by-turn text tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { buildCitizenEvacuationRoute } from "@/lib/map/citizen-evacuation-route";
import {
  bearingName,
  buildStepDirections,
  flattenRoute,
  formatMetres,
} from "./step-directions";

const ORIGIN = { lat: 25.55, lng: 85.1 };
const DEST = { lat: 25.6, lng: 85.25 };

describe("bearingName", () => {
  it("snaps bearings to the 8-point compass", () => {
    expect(bearingName(0)).toBe("N");
    expect(bearingName(45)).toBe("NE");
    expect(bearingName(90)).toBe("E");
    expect(bearingName(135)).toBe("SE");
    expect(bearingName(180)).toBe("S");
    expect(bearingName(225)).toBe("SW");
    expect(bearingName(270)).toBe("W");
    expect(bearingName(315)).toBe("NW");
  });

  it("normalizes negative / overflowing bearings", () => {
    expect(bearingName(-90)).toBe("W");
    expect(bearingName(360)).toBe("N");
  });
});

describe("formatMetres", () => {
  it("renders km with one decimal and drops trailing .0", () => {
    expect(formatMetres(800)).toBe("800 m");
    expect(formatMetres(1200)).toBe("1.2 km");
    expect(formatMetres(1000)).toBe("1 km");
  });
});

describe("buildStepDirections", () => {
  it("produces stepCount steps plus an arrival step", () => {
    const route = buildCitizenEvacuationRoute(
      ORIGIN.lat,
      ORIGIN.lng,
      DEST.lat,
      DEST.lng,
      { type: "FeatureCollection", features: [] },
    );
    const steps = buildStepDirections(flattenRoute(route), 4);

    expect(steps).toHaveLength(5);
    expect(steps[0].instruction).toMatch(/^Head /);
    expect(steps[steps.length - 1].instruction).toContain("arrived");
    expect(steps[steps.length - 1].distanceMeters).toBe(0);
  });

  it("step distances add up to roughly the route length", () => {
    const route = buildCitizenEvacuationRoute(
      ORIGIN.lat,
      ORIGIN.lng,
      DEST.lat,
      DEST.lng,
      { type: "FeatureCollection", features: [] },
    );
    const steps = buildStepDirections(flattenRoute(route), 4);
    const total = steps.reduce((sum, s) => sum + s.distanceMeters, 0);
    // Patna default ORIGIN→DEST ≈ 17–19 km of mock road.
    expect(total).toBeGreaterThan(15000);
    expect(total).toBeLessThan(21000);
  });

  it("returns an empty list for a degenerate polyline", () => {
    expect(buildStepDirections([[85.1, 25.55]])).toEqual([]);
  });
});

describe("flattenRoute", () => {
  it("de-duplicates shared joint vertices into one polyline", () => {
    const route = buildCitizenEvacuationRoute(
      ORIGIN.lat,
      ORIGIN.lng,
      DEST.lat,
      DEST.lng,
      { type: "FeatureCollection", features: [] },
    );
    const poly = flattenRoute(route);
    // First point == route start, last point == route end.
    expect(poly[0]).toEqual(route.features[0].geometry.coordinates[0]);
    expect(poly[poly.length - 1]).toEqual(
      route.features[route.features.length - 1].geometry.coordinates[1],
    );
  });
});