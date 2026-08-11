// ---------------------------------------------------------------------
// lib/map/google-maps-directions.test.ts — Phase 1 · Step 6 · "Open in
// Google Maps" URL + ETA helper tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  estimateGoogleMapsEtaMinutes,
  googleMapsDirectionsUrl,
} from "./google-maps-directions";

describe("googleMapsDirectionsUrl", () => {
  it("builds the strict Google Maps walking-directions deep link", () => {
    expect(googleMapsDirectionsUrl(25.5941, 85.1376, 25.609, 85.164)).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=25.5941,85.1376&destination=25.609,85.164&travelmode=walking",
    );
  });

  it("leaves commas raw (URLSearchParams would encode them and break the link)", () => {
    const url = googleMapsDirectionsUrl(25.5, 85.1, 25.6, 85.2);
    expect(url).toContain("origin=25.5,85.1");
    expect(url).not.toContain("%2C");
    expect(url).toContain("api=1");
    expect(url).toContain("travelmode=walking");
  });
});

describe("estimateGoogleMapsEtaMinutes", () => {
  it("floors at 1 minute", () => {
    expect(estimateGoogleMapsEtaMinutes(25.5, 85.1, 25.50001, 85.10001)).toBe(1);
  });

  it("estimates ~12 minutes per km at 5 km/h", () => {
    // ~1 km east at 25.5°N.
    const minutes = estimateGoogleMapsEtaMinutes(25.5, 85.1, 25.5, 85.109);
    expect(minutes).toBeGreaterThanOrEqual(11);
    expect(minutes).toBeLessThanOrEqual(13);
  });
});
