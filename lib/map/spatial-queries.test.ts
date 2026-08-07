// Phase 8 — shelter geospatial query tests: nearest-available lookup with
// distance computation and full-shelter filtering (PostGIS mirror).
import { describe, it, expect } from "vitest";
import {
  findNearestAvailableShelters,
  type SpatialShelter,
} from "./spatial-queries";

const SHELTERS: SpatialShelter[] = [
  {
    id: "s-full",
    name: "Riverside Hall (Full)",
    district: "Patna",
    lat: 25.5941,
    lng: 85.1376,
    capacity: 200,
    currentOccupancy: 200,
    status: "full",
    facilities: null,
  },
  {
    id: "s-nearest",
    name: "Central Community Hall",
    district: "Patna",
    lat: 25.5945,
    lng: 85.138,
    capacity: 450,
    currentOccupancy: 138,
    status: "open",
    facilities: { water: true, food: true, medical: false },
  },
  {
    id: "s-close",
    name: "District Hospital Annex",
    district: "Patna",
    lat: 25.60,
    lng: 85.15,
    capacity: 300,
    currentOccupancy: 206,
    status: "open",
    facilities: null,
  },
  {
    id: "s-far",
    name: "Danapur High School",
    district: "Patna",
    lat: 25.68,
    lng: 85.12,
    capacity: 380,
    currentOccupancy: 100,
    status: "open",
    facilities: null,
  },
];

// Target is a village near the river, ~2 km from the nearest shelter.
const TARGET = { lat: 25.61, lng: 85.145 };

describe("findNearestAvailableShelters (Phase 8)", () => {
  it("excludes shelters marked full from the candidates", () => {
    const result = findNearestAvailableShelters(TARGET.lat, TARGET.lng, SHELTERS, 10);
    expect(result.some((s) => s.id === "s-full")).toBe(false);
  });

  it("returns shelters sorted by ascending geodesic distance", () => {
    const result = findNearestAvailableShelters(TARGET.lat, TARGET.lng, SHELTERS, 10);
    const ids = result.map((s) => s.id);
    // District Hospital Annex is ~1.1 km, Central Hall ~1.9 km, Danapur ~8 km.
    expect(ids[0]).toBe("s-close");
    expect(ids[1]).toBe("s-nearest");
    expect(ids[2]).toBe("s-far");
  });

  it("injects distance_km onto each returned shelter", () => {
    const result = findNearestAvailableShelters(TARGET.lat, TARGET.lng, SHELTERS, 3);
    for (const shelter of result) {
      expect(typeof shelter.distance_km).toBe("number");
      expect(shelter.distance_km!).toBeGreaterThan(0);
    }
  });

  it("respects the requested limit", () => {
    const result = findNearestAvailableShelters(TARGET.lat, TARGET.lng, SHELTERS, 2);
    expect(result).toHaveLength(2);
  });

  it("returns an empty list when every shelter is full", () => {
    const allFull = SHELTERS.map((s) => ({ ...s, status: "full" }));
    const result = findNearestAvailableShelters(TARGET.lat, TARGET.lng, allFull, 3);
    expect(result).toEqual([]);
  });

  it("handles an empty shelter list gracefully", () => {
    const result = findNearestAvailableShelters(TARGET.lat, TARGET.lng, [], 3);
    expect(result).toEqual([]);
  });
});
