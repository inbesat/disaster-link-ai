// Phase 26 — FM station geospatial coverage lookup tests: radius matching,
// AIR-first ranking, inactive/coord-less filtering, and polygon generation.
import { describe, it, expect } from "vitest";
import {
  findStationsInRadius,
  rankStationsByCoverage,
  coverageCircleGeoJSON,
  type FmStationLike,
} from "./find-stations";

const STATIONS: FmStationLike[] = [
  {
    id: "air-patna",
    name: "AIR Patna FM",
    frequency: "98.3 MHz",
    city: "Patna",
    state: "Bihar",
    lat: 25.5941,
    lng: 85.1376,
    coverageRadiusKm: 45,
    type: "air",
    rdsEnabled: true,
    emergencyApiEndpoint: null,
    emergencyContactPhone: null,
  },
  {
    id: "pr-patna",
    name: "Radio Mirchi Patna",
    frequency: "98.3 MHz",
    city: "Patna",
    state: "Bihar",
    lat: 25.5941,
    lng: 85.1376,
    coverageRadiusKm: 45,
    type: "private",
    rdsEnabled: true,
    emergencyApiEndpoint: null,
    emergencyContactPhone: null,
  },
  {
    id: "pr-muzaffarpur",
    name: "Red FM Muzaffarpur",
    frequency: "93.5 MHz",
    city: "Muzaffarpur",
    state: "Bihar",
    lat: 26.1225,
    lng: 85.3908,
    coverageRadiusKm: 35,
    type: "private",
    rdsEnabled: false,
    emergencyApiEndpoint: null,
    emergencyContactPhone: null,
  },
  {
    id: "pr-inactive",
    name: "Big FM Inactive",
    frequency: "92.7 MHz",
    city: "Patna",
    state: "Bihar",
    lat: 25.6,
    lng: 85.14,
    coverageRadiusKm: 50,
    type: "private",
    rdsEnabled: false,
    emergencyApiEndpoint: null,
    emergencyContactPhone: null,
  },
  {
    id: "air-no-coords",
    name: "AIR Unknown Site",
    frequency: "100.1 MHz",
    city: "Unknown",
    state: "Bihar",
    lat: null,
    lng: null,
    coverageRadiusKm: 50,
    type: "air",
    rdsEnabled: false,
    emergencyApiEndpoint: null,
    emergencyContactPhone: null,
  },
];

// Target is the floodplain village near Patna (~4 km from city centre).
const TARGET = { lat: 25.62, lng: 85.15 };

describe("findStationsInRadius (Phase 26)", () => {
  it("matches stations whose coverage reaches the target point", () => {
    const result = findStationsInRadius(TARGET.lat, TARGET.lng, STATIONS, 50);
    const ids = result.map((s) => s.id);
    expect(ids).toContain("air-patna");
    expect(ids).toContain("pr-patna");
    expect(ids).not.toContain("pr-muzaffarpur"); // ~70 km away, out of 35 km reach
  });

  it("excludes inactive stations", () => {
    const withInactive = STATIONS.map((s) =>
      s.id === "pr-inactive" ? { ...s, isActive: false } : s,
    );
    const result = findStationsInRadius(TARGET.lat, TARGET.lng, withInactive, 50);
    expect(result.some((s) => s.id === "pr-inactive")).toBe(false);
  });

  it("never matches stations without coordinates", () => {
    const result = findStationsInRadius(TARGET.lat, TARGET.lng, STATIONS, 50);
    expect(result.some((s) => s.id === "air-no-coords")).toBe(false);
  });

  it("ranks AIR stations before private stations at equal reach", () => {
    const result = findStationsInRadius(TARGET.lat, TARGET.lng, STATIONS, 50);
    const airIdx = result.findIndex((s) => s.id === "air-patna");
    const privIdx = result.findIndex((s) => s.id === "pr-patna");
    expect(airIdx).toBeGreaterThanOrEqual(0);
    expect(privIdx).toBeGreaterThan(airIdx);
  });

  it("injects distance_km on each returned station", () => {
    const result = findStationsInRadius(TARGET.lat, TARGET.lng, STATIONS, 50);
    for (const s of result) {
      expect(typeof s.distance_km).toBe("number");
      expect(s.distance_km!).toBeGreaterThan(0);
    }
  });

  it("honours a tighter disaster radius", () => {
    const tight = findStationsInRadius(26.1225, 85.3908, STATIONS, 5);
    expect(tight.map((s) => s.id)).toContain("pr-muzaffarpur");
  });

  it("handles an empty station list gracefully", () => {
    expect(findStationsInRadius(TARGET.lat, TARGET.lng, [], 50)).toEqual([]);
  });
});

describe("rankStationsByCoverage (Phase 26)", () => {
  it("sorts AIR first regardless of distance tie-breaks", () => {
    const ranked = rankStationsByCoverage([
      { ...STATIONS[1], distance_km: 2 }, // private, closer
      { ...STATIONS[0], distance_km: 5 }, // air, farther
    ]);
    expect(ranked[0].id).toBe("air-patna");
  });

  it("tie-breaks equal tiers by distance then coverage reach", () => {
    const ranked = rankStationsByCoverage([
      { ...STATIONS[1], distance_km: 4 }, // 45 km reach
      { ...STATIONS[3], distance_km: 4, coverageRadiusKm: 60 }, // 60 km reach
    ]);
    expect(ranked[0].id).toBe("pr-inactive"); // bigger reach wins
  });
});

describe("coverageCircleGeoJSON (Phase 26)", () => {
  it("produces a GeoJSON Polygon with lng/lat coordinates", () => {
    const polygon = coverageCircleGeoJSON(25.6, 85.14, 45);
    expect(polygon.type).toBe("Feature");
    expect(polygon.geometry.type).toBe("Polygon");
    const ring = polygon.geometry.coordinates[0];
    expect(ring.length).toBeGreaterThan(2);
    // Every vertex is [lng, lat] and stays near the transmitter.
    for (const [lng, lat] of ring) {
      expect(lng).toBeCloseTo(85.14, 0);
      expect(lat).toBeCloseTo(25.6, 0);
    }
  });

  it("clamps a zero radius to 1 km", () => {
    const polygon = coverageCircleGeoJSON(25.6, 85.14, 0);
    expect(polygon.geometry.coordinates[0].length).toBeGreaterThan(2);
  });
});
