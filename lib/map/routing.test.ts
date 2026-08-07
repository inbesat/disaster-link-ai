// Phase 9 — evacuation route engine tests: flood-aware routing safety
// validation and the OSRM straight-line fallback.
import { describe, it, expect, vi, afterEach } from "vitest";
import { lineString, polygon } from "@turf/helpers";
import {
  validateRouteSafety,
  getEvacuationRoute,
  type RoadClosureInput,
} from "./routing";

afterEach(() => {
  vi.restoreAllMocks();
});

// A straight corridor from Patna (25.59, 85.14) heading northeast.
const corridor = lineString([
  [85.1, 25.5],
  [85.3, 25.7],
]);

describe("validateRouteSafety (Phase 9)", () => {
  it("reports the route as safe when there are no hazards", () => {
    const result = validateRouteSafety(corridor, [], []);
    expect(result.isSafe).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("flags a route crossing a critical flood zone", () => {
    const criticalZone = polygon([
      [
        [85.1, 25.5],
        [85.4, 25.5],
        [85.4, 25.8],
        [85.1, 25.8],
        [85.1, 25.5],
      ],
    ]);
    // Properties are read from the GeoJSON Feature.properties.
    (criticalZone.properties as Record<string, unknown>).riskLevel = "evacuate";
    const result = validateRouteSafety(corridor, [criticalZone]);
    expect(result.isSafe).toBe(false);
    expect(result.warnings[0]).toMatch(/critical flood zone/i);
  });

  it("flags an active road closure near the path", () => {
    const closure: RoadClosureInput = {
      id: "rc-1",
      lat: 25.6,
      lng: 85.2,
      reason: "Bridge washed out",
      isActive: true,
    };
    const result = validateRouteSafety(corridor, [], [closure]);
    expect(result.isSafe).toBe(false);
    expect(result.warnings[0]).toMatch(/road blocked/i);
  });

  it("ignores inactive road closures", () => {
    const closure: RoadClosureInput = {
      id: "rc-1",
      lat: 25.6,
      lng: 85.2,
      reason: "bridge washed out",
      isActive: false,
    };
    const result = validateRouteSafety(corridor, [], [closure]);
    expect(result.isSafe).toBe(true);
  });
});

describe("getEvacuationRoute (Phase 9)", () => {
  it("falls back to a straight-line route when OSRM is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const route = await getEvacuationRoute(85.1, 25.5, 85.3, 25.7);
    expect(route.distanceMeters).toBeGreaterThan(0);
    expect(route.durationSeconds).toBeGreaterThan(0);
    expect(route.geometry.type).toBe("Feature");
    expect(route.geometry.geometry?.type).toBe("LineString");
    expect(route.geometry.geometry?.coordinates).toHaveLength(2);
    vi.unstubAllGlobals();
  });

  it("returns the OSRM route geometry when the API succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          code: "Ok",
          routes: [
            {
              geometry: {
                type: "LineString",
                coordinates: [
                  [85.1, 25.5],
                  [85.2, 25.6],
                  [85.3, 25.7],
                ],
              },
              distance: 5000,
              duration: 600,
            },
          ],
        }),
      }),
    );
    const route = await getEvacuationRoute(85.1, 25.5, 85.3, 25.7);
    expect(route.distanceMeters).toBe(5000);
    expect(route.durationSeconds).toBe(600);
    expect(route.geometry.geometry?.coordinates).toHaveLength(3);
    vi.unstubAllGlobals();
  });
});
