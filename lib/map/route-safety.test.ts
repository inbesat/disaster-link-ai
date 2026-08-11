// ---------------------------------------------------------------------
// lib/map/route-safety.test.ts — Phase 1 · Step 9 · Route Safety Score
// engine tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { polygon } from "@turf/helpers";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import {
  CLOSURE_PROXIMITY_METERS,
  classifyCitizenRoute,
  haversineDistanceMeters,
  mockRerouteAvailable,
  resamplePolyline,
  ROUTE_HAZARD_COLORS,
  ROUTE_HAZARDS,
  ROUTE_SEGMENT_COUNT,
  type RouteSafetyClassification,
} from "./route-safety";
import type { RoadClosureLike } from "./road-closures-client";

// Patna-area points — the mock route runs roughly east from the origin.
const ORIGIN = { lat: 25.55, lng: 85.1 };
const DEST = { lat: 25.6, lng: 85.25 };

// A wide flood band straddling the middle of the route.
const MID_FLOOD: Feature<Polygon> = polygon([
  [
    [85.16, 25.53],
    [85.24, 25.53],
    [85.24, 25.63],
    [85.16, 25.63],
    [85.16, 25.53],
  ],
]);

const ZONES: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [MID_FLOOD],
};

function closure(lat: number, lng: number, isActive = true): RoadClosureLike {
  return { id: "closure-test", lat, lng, reason: "test barricade", isActive };
}

describe("classifyCitizenRoute", () => {
  it("grades a clear route 100% safe with no hazards", () => {
    const result = classifyCitizenRoute(
      ORIGIN.lat,
      ORIGIN.lng,
      DEST.lat,
      DEST.lng,
      { type: "FeatureCollection", features: [] },
      [],
    );
    expect(result.segmentCount).toBe(ROUTE_SEGMENT_COUNT);
    expect(result.score).toBe(100);
    expect(result.floodHazards).toBe(0);
    expect(result.closedHazards).toBe(0);
    expect(result.watchHazards).toBe(0);
    expect(result.hazards.every((h) => h === "safe")).toBe(true);
    expect(result.features).toHaveLength(ROUTE_SEGMENT_COUNT);
    // Every segment carries its hazard in the props for the map layers.
    expect(result.features[0].properties.hazard).toBe("safe");
  });

  it("flags segments inside a flood polygon as flooded", () => {
    const result = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, ZONES, []);
    expect(result.floodHazards).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(100);
    expect(result.hazards).toContain("flooded");
  });

  it("marks a segment blocked when an active closure sits on it", () => {
    // Grade once with no closures to learn where segment 7 actually lies.
    const clean = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, ZONES, []);
    const seg = clean.features[7];
    const [lng1, lat1] = seg.geometry.coordinates[0];
    const [lng2, lat2] = seg.geometry.coordinates[1];

    const result = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, ZONES, [
      closure((lat1 + lat2) / 2, (lng1 + lng2) / 2, true),
    ]);
    expect(result.hazards[7]).toBe("closed");
    expect(result.closedHazards).toBeGreaterThan(0);
  });

  it("ignores an inactive closure at the same spot", () => {
    const clean = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, ZONES, []);
    const seg = clean.features[7];
    const [lng1, lat1] = seg.geometry.coordinates[0];
    const [lng2, lat2] = seg.geometry.coordinates[1];

    const result = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, ZONES, [
      closure((lat1 + lat2) / 2, (lng1 + lng2) / 2, false),
    ]);
    expect(result.hazards[7]).not.toBe("closed");
  });

  it("grades a segment near (but outside) danger as watch", () => {
    // Learn where segment 5 lies on a clear route, then park a small zone
    // ~1.2 km off its midpoint — close enough to read as "watch", far
    // enough to never touch the path itself (so it can't become flooded).
    const clean = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, {
      type: "FeatureCollection",
      features: [],
    }, []);
    const seg = clean.features[5];
    const [lng1, lat1] = seg.geometry.coordinates[0];
    const [lng2, lat2] = seg.geometry.coordinates[1];
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;

    const nearZone: Feature<Polygon> = polygon([
      [
        [midLng - 0.005, midLat - 0.012],
        [midLng + 0.005, midLat - 0.012],
        [midLng + 0.005, midLat - 0.008],
        [midLng - 0.005, midLat - 0.008],
        [midLng - 0.005, midLat - 0.012],
      ],
    ]);
    const result = classifyCitizenRoute(
      ORIGIN.lat,
      ORIGIN.lng,
      DEST.lat,
      DEST.lng,
      { type: "FeatureCollection", features: [nearZone] },
      [],
    );
    expect(result.floodHazards).toBe(0);
    expect(result.hazards[5]).toBe("watch");
    expect(result.watchHazards).toBeGreaterThan(0);
  });
});

describe("score", () => {
  it("is the % of safe segments, rounded", () => {
    const result = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, ZONES, []);
    const safeCount = result.hazards.filter((h) => h === "safe").length;
    expect(result.score).toBe(Math.round((100 * safeCount) / result.segmentCount));
  });
});

describe("resamplePolyline", () => {
  it("returns segmentCount + 1 points and preserves the endpoints", () => {
    const coords: [number, number][] = [
      [85.1, 25.55],
      [85.15, 25.57],
      [85.2, 25.6],
      [85.25, 25.6],
    ];
    const out = resamplePolyline(coords, 12);
    expect(out).toHaveLength(13);
    expect(out[0]).toEqual(coords[0]);
    expect(out[out.length - 1]).toEqual(coords[coords.length - 1]);
  });
});

describe("haversineDistanceMeters", () => {
  it("≈ 111 km per degree of latitude", () => {
    const d = haversineDistanceMeters(25.55, 85.1, 26.55, 85.1);
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });

  it("is 0 between identical points", () => {
    expect(haversineDistanceMeters(25.55, 85.1, 25.55, 85.1)).toBe(0);
  });
});

describe("mockRerouteAvailable", () => {
  it("returns true when any segment is flooded or closed", () => {
    const flooded: RouteSafetyClassification = {
      segmentCount: 12,
      score: 75,
      floodHazards: 3,
      closedHazards: 0,
      watchHazards: 0,
      hazards: ["safe", "flooded", "flooded", "safe"],
      features: [],
    };
    expect(mockRerouteAvailable(flooded)).toBe(true);

    const closed: RouteSafetyClassification = {
      ...flooded,
      floodHazards: 0,
      closedHazards: 1,
      hazards: ["closed", "safe", "safe"],
    };
    expect(mockRerouteAvailable(closed)).toBe(true);
  });

  it("returns false on a fully safe route", () => {
    const safe = classifyCitizenRoute(ORIGIN.lat, ORIGIN.lng, DEST.lat, DEST.lng, {
      type: "FeatureCollection",
      features: [],
    }, []);
    expect(mockRerouteAvailable(safe)).toBe(false);
  });
});

describe("ROUTE_HAZARD_COLORS", () => {
  it("exposes a color for every hazard level", () => {
    for (const hazard of ROUTE_HAZARDS) {
      expect(ROUTE_HAZARD_COLORS[hazard]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
    expect(ROUTE_HAZARD_COLORS.closed).not.toBe(ROUTE_HAZARD_COLORS.safe);
    expect(CLOSURE_PROXIMITY_METERS).toBeLessThan(300);
  });
});