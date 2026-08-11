// ---------------------------------------------------------------------
// lib/map/gov-measurements.test.ts — Phase 8 · Step 4.
// Pins the turf length/area math behind the gov MeasurementToolbar:
// ≥2 points for distance, ≥3 for area, ring auto-closing, formatting.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  formatAreaSqKm,
  formatDistanceKm,
  measureAreaSqKm,
  measureDistanceKm,
  measureLabel,
} from "./gov-measurements";

describe("measureDistanceKm", () => {
  it("returns 0 with fewer than 2 points", () => {
    expect(measureDistanceKm([])).toBe(0);
    expect(measureDistanceKm([[85.1, 25.6]])).toBe(0);
  });

  it("measures a straight east-west path", () => {
    // ~1° of longitude at the equator ≈ 111 km.
    const km = measureDistanceKm([
      [0, 0],
      [1, 0],
    ]);
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(112);
  });

  it("measures a multi-segment path", () => {
    const km = measureDistanceKm([
      [0, 0],
      [0.5, 0],
      [0.5, 0.5],
    ]);
    // Two ~55.6 km legs → ~111 km total.
    expect(km).toBeGreaterThan(110);
    expect(km).toBeLessThan(113);
  });
});

describe("measureAreaSqKm", () => {
  it("returns 0 with fewer than 3 points", () => {
    expect(measureAreaSqKm([])).toBe(0);
    expect(
      measureAreaSqKm([
        [0, 0],
        [1, 0],
      ]),
    ).toBe(0);
  });

  it("measures a 1°×1° square near the equator (~12,300 km²)", () => {
    const sqKm = measureAreaSqKm([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    expect(sqKm).toBeGreaterThan(12000);
    expect(sqKm).toBeLessThan(12600);
  });

  it("closes an open click-path back to the first point", () => {
    const closed = measureAreaSqKm([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    // Same 4 corners given in order but omitting the implicit closing
    // vertex — the helper must close it for the measurement to be equal.
    const open = measureAreaSqKm([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ]);
    expect(open).toBeGreaterThan(12000);
    expect(Math.abs(closed - open)).toBeLessThan(closed * 0.01);
  });
});

describe("formatting", () => {
  it("formats distances with sensible precision", () => {
    expect(formatDistanceKm(2.42)).toBe("2.42 km");
    expect(formatDistanceKm(24.2)).toBe("24.2 km");
    expect(formatDistanceKm(240)).toBe("240 km");
  });

  it("formats areas with the squared-km unit", () => {
    expect(formatAreaSqKm(3.254)).toBe("3.25 km²");
    expect(formatAreaSqKm(0)).toBe("0.00 km²");
  });
});

describe("measureLabel", () => {
  it("routes distance and area to their own formatters", () => {
    // ~1° of longitude at the equator ≈ 111.19 km — a pinned literal, not
    // the implementation itself, so the label path is genuinely exercised.
    expect(measureLabel("distance", [[0, 0], [1, 0]])).toBe("111 km");
    expect(measureLabel("area", [[0, 0], [1, 0], [1, 1], [0, 1]])).toContain("km²");
  });
});
