import { describe, expect, it } from "vitest";
import {
  CITIZEN_SHELTERS,
  shelterDistanceKm,
  shelterOccupancyPct,
  shelterStatus,
} from "./citizen-shelters";

describe("CITIZEN_SHELTERS", () => {
  it("has valid, internally consistent data", () => {
    for (const shelter of CITIZEN_SHELTERS) {
      expect(shelter.id).toBeTruthy();
      expect(shelter.capacity).toBeGreaterThan(0);
      expect(shelter.occupancy).toBeGreaterThanOrEqual(0);
      expect(shelter.occupancy).toBeLessThanOrEqual(shelter.capacity);
      expect(Number.isFinite(shelter.lat)).toBe(true);
      expect(Number.isFinite(shelter.lng)).toBe(true);
    }
  });
});

describe("shelterOccupancyPct", () => {
  it("rounds to a whole percentage", () => {
    expect(shelterOccupancyPct({ capacity: 100, occupancy: 45 })).toBe(45);
    expect(shelterOccupancyPct({ capacity: 150, occupancy: 108 })).toBe(72);
  });

  it("treats a broken capacity as full", () => {
    expect(shelterOccupancyPct({ capacity: 0, occupancy: 10 })).toBe(100);
  });
});

describe("shelterStatus", () => {
  it("returns available below 50%", () => {
    expect(shelterStatus({ capacity: 100, occupancy: 45 })).toBe("available");
  });

  it("returns filling from 50% to 79%", () => {
    expect(shelterStatus({ capacity: 100, occupancy: 50 })).toBe("filling");
    expect(shelterStatus({ capacity: 150, occupancy: 108 })).toBe("filling");
    expect(shelterStatus({ capacity: 100, occupancy: 79 })).toBe("filling");
  });

  it("returns full at 80% and above", () => {
    expect(shelterStatus({ capacity: 100, occupancy: 80 })).toBe("full");
    expect(shelterStatus({ capacity: 450, occupancy: 450 })).toBe("full");
  });
});

describe("shelterDistanceKm", () => {
  it("returns 0 for the shelter's own position", () => {
    const shelter = CITIZEN_SHELTERS[0];
    expect(shelterDistanceKm(shelter, shelter.lat, shelter.lng)).toBeCloseTo(0, 5);
  });

  it("returns a plausible city-scale distance from Patna center", () => {
    const centralHall = CITIZEN_SHELTERS[0];
    const km = shelterDistanceKm(centralHall, 25.5941, 85.1376);
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(5);
  });
});
