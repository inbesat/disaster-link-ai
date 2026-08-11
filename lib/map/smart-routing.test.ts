// ---------------------------------------------------------------------
// lib/map/smart-routing.test.ts — Phase 1 · Step 5 · Smart Route
// Evaluation Engine tests.
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import { polygon } from "@turf/helpers";
import {
  bowRoute,
  computeFloodRiskLevel,
  estimateWalkingEta,
  floodAvoidanceDirection,
  generateSmartRoutes,
} from "./smart-routing";
import type { Feature, Polygon } from "geojson";

// Patna-area points.
const ORIGIN = { lat: 25.55, lng: 85.1 };
const DEST = { lat: 25.55, lng: 85.25 };

// A flood zone straddling the middle of the ORIGIN→DEST line, leaving the
// destination (east) and origin (west) clear so a detour CAN avoid it.
const MID_FLOOD: Feature<Polygon> = polygon([
  [
    [85.14, 25.54],
    [85.24, 25.54],
    [85.24, 25.62],
    [85.14, 25.62],
    [85.14, 25.54],
  ],
]);

// Mock OSRM unreachable → straight-line fallback (deterministic geometry).
function stubOsrmDown() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
}

describe("generateSmartRoutes", () => {
  it("returns three distinct route options", async () => {
    stubOsrmDown();
    const routes = await generateSmartRoutes(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng);
    vi.unstubAllGlobals();

    expect(routes.map((r) => r.kind)).toEqual([
      "recommended",
      "shortest",
      "alternative",
    ]);
    // The bowed routes have 25 points; the direct fallback has 2.
    expect(routes.filter((r) => r.geometry.geometry?.coordinates.length === 25)).toHaveLength(2);
    expect(routes.find((r) => r.kind === "shortest")?.geometry.geometry?.coordinates).toHaveLength(2);
  });

  it("every route carries geometry, distance, ETA and a risk level", async () => {
    stubOsrmDown();
    const routes = await generateSmartRoutes(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, [
      MID_FLOOD,
    ]);
    vi.unstubAllGlobals();

    for (const route of routes) {
      expect(route.geometry.geometry?.type).toBe("LineString");
      expect(route.distanceMeters).toBeGreaterThan(0);
      expect(route.etaMinutes).toBeGreaterThan(0);
      expect(["low", "medium", "high"]).toContain(route.floodRiskLevel);
    }
  });

  it("penalises the flooded path heavily on the recommended route", async () => {
    stubOsrmDown();
    const routes = await generateSmartRoutes(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, [
      MID_FLOOD,
    ]);
    vi.unstubAllGlobals();

    const recommended = routes.find((r) => r.kind === "recommended");
    const shortest = routes.find((r) => r.kind === "shortest");
    // The direct line cuts straight through the flood; the recommended route
    // must be strictly safer.
    expect(shortest?.floodRiskLevel).toBe("high");
    expect(["low", "medium"]).toContain(recommended?.floodRiskLevel);
  });

  it("does not call OSRM twice for the same pair when the API is up", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: "Ok",
        routes: [
          {
            geometry: {
              type: "LineString",
              coordinates: [
                [85.1, 25.55],
                [85.15, 25.55],
                [85.2, 25.55],
              ],
            },
            distance: 12000,
            duration: 900,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const routes = await generateSmartRoutes(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng);
    vi.unstubAllGlobals();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(routes.find((r) => r.kind === "shortest")?.distanceMeters).toBe(12000);
  });
});

describe("computeFloodRiskLevel", () => {
  it("returns low when there are no flood polygons", () => {
    const geometry = bowRoute([85.1, 25.55], [85.2, 25.55], [0, -1], 1);
    expect(computeFloodRiskLevel(geometry, [])).toBe("low");
  });

  it("returns high when the path crosses a flood polygon", () => {
    const geometry = bowRoute([85.1, 25.55], [85.2, 25.55], [0, -1], 0);
    expect(computeFloodRiskLevel(geometry, [MID_FLOOD])).toBe("high");
  });
});

describe("estimateWalkingEta", () => {
  it("floors at 1 minute", () => {
    expect(estimateWalkingEta(10)).toBe(1);
  });

  it("estimates ~12 minutes per km at 5 km/h", () => {
    expect(estimateWalkingEta(1000)).toBe(12);
    expect(estimateWalkingEta(2500)).toBe(30);
  });
});

describe("floodAvoidanceDirection", () => {
  it("points away from a flanking flood centroid", () => {
    const dir = floodAvoidanceDirection(
      [85.1, 25.55],
      [85.2, 25.55],
      [MID_FLOOD],
    );
    // Flood centroid is north-east of the mid-path → steer south-west.
    expect(dir[0]).toBeLessThan(0);
    expect(dir[1]).toBeLessThan(0);
  });

  it("falls back to the perpendicular with no flood polygons", () => {
    const dir = floodAvoidanceDirection([85.1, 25.55], [85.2, 25.55], []);
    // Direction of travel is +x → perpendicular is +y (north).
    expect(dir[0]).toBeCloseTo(0);
    expect(dir[1]).toBe(1);
  });
});
