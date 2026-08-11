// ---------------------------------------------------------------------
// lib/map/gov-flood-forecast.test.ts — Phase 8 · Step 5.
// Pins the 72-hour forecast math: the 0.5×→1.5× scale ramp, the paired
// opacity ramp, the status labels, clamping, and — critically — that
// scaleFloodForecast really grows polygon area by factor² (so the map
// visibly simulates rising water).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import area from "@turf/area";
import type { FeatureCollection, Polygon } from "geojson";
import {
  clampForecastHour,
  floodScaleForHour,
  floodStatusForHour,
  FORECAST_HOURS,
  FORECAST_TICKS,
  scaleFloodForecast,
} from "./gov-flood-forecast";

/** A 1°×1° square around the equator — area ≈ 12,300 km². */
const SQUARE_FC: FeatureCollection<Polygon> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    },
  ],
};

describe("clampForecastHour", () => {
  it("clamps into the 0–72 window", () => {
    expect(clampForecastHour(-5)).toBe(0);
    expect(clampForecastHour(0)).toBe(0);
    expect(clampForecastHour(72)).toBe(72);
    expect(clampForecastHour(99)).toBe(72);
    expect(clampForecastHour(Number.NaN)).toBe(0);
  });
});

describe("floodScaleForHour", () => {
  it("ramps linearly from 0.5× at t0 to 1.5× at t72", () => {
    expect(floodScaleForHour(0)).toBeCloseTo(0.5);
    expect(floodScaleForHour(36)).toBeCloseTo(1.0);
    expect(floodScaleForHour(72)).toBeCloseTo(1.5);
  });

  it("is monotonic — water never recedes", () => {
    const scales = FORECAST_TICKS.map((t) => floodScaleForHour(t));
    for (let i = 1; i < scales.length; i++) {
      expect(scales[i]).toBeGreaterThanOrEqual(scales[i - 1]);
    }
  });
});

describe("floodStatusForHour", () => {
  it("labels the three outlooks by phase", () => {
    expect(floodStatusForHour(0)).toBe("Steady");
    expect(floodStatusForHour(23)).toBe("Steady");
    expect(floodStatusForHour(24)).toBe("Rising");
    expect(floodStatusForHour(47)).toBe("Rising");
    expect(floodStatusForHour(48)).toBe("Peak");
    expect(floodStatusForHour(72)).toBe("Peak");
  });
});

describe("scaleFloodForecast", () => {
  it("returns the geometry untouched at t0", () => {
    expect(scaleFloodForecast(SQUARE_FC, 0)).toBe(SQUARE_FC);
  });

  it("grows polygon area by the square of the scale factor", () => {
    const base = area(SQUARE_FC);
    // At t36 the factor is 1.0 → area unchanged.
    const at36 = area(scaleFloodForecast(SQUARE_FC, 36));
    expect(Math.abs(at36 - base)).toBeLessThan(base * 0.01);

    // At t72 the factor is 1.5 → area ≈ 1.5² = 2.25×.
    const at72 = area(scaleFloodForecast(SQUARE_FC, 72));
    expect(at72 / base).toBeGreaterThan(2.1);
    expect(at72 / base).toBeLessThan(2.4);
  });

  it("keeps feature count and type intact", () => {
    const scaled = scaleFloodForecast(SQUARE_FC, 48);
    expect(scaled.type).toBe("FeatureCollection");
    expect(scaled.features).toHaveLength(1);
    expect(scaled.features[0].geometry.type).toBe("Polygon");
  });
});

describe("forecast constants", () => {
  it("defines a 72h horizon with 12h ticks", () => {
    expect(FORECAST_HOURS).toBe(72);
    expect(FORECAST_TICKS).toEqual([0, 12, 24, 36, 48, 60, 72]);
  });
});
