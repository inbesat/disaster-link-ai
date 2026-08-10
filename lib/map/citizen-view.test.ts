import { describe, expect, it } from "vitest";
import type { CitizenLocation } from "../mock-data/hazard-zones";
import { CITIZEN_MAP_DEFAULTS, resolveCitizenMapView } from "./citizen-view";

const GPS_LOCATION: CitizenLocation = {
  type: "gps",
  lat: 25.6,
  lng: 85.1,
  savedAt: new Date().toISOString(),
};

function manualLocation(district: string, village = "Main Bazaar"): CitizenLocation {
  return { type: "manual", district, village, savedAt: new Date().toISOString() };
}

describe("resolveCitizenMapView", () => {
  it("falls back to the Patna default when no location is saved", () => {
    expect(resolveCitizenMapView(null)).toEqual(CITIZEN_MAP_DEFAULTS);
  });

  it("centers on a GPS fix at street-level zoom", () => {
    const view = resolveCitizenMapView(GPS_LOCATION);
    expect(view.center).toEqual({ lat: 25.6, lng: 85.1 });
    expect(view.zoom).toBeGreaterThanOrEqual(13);
    expect(view.label).toBe("Your location");
  });

  it("maps a manual district to its hazard-zone centroid", () => {
    const view = resolveCitizenMapView(manualLocation("Patna", "Kankarbagh"));
    expect(view.center).toEqual({ lat: 25.5941, lng: 85.1376 });
    expect(view.zoom).toBe(11);
    expect(view.label).toBe("Kankarbagh, Patna");
  });

  it("matches district names case-insensitively", () => {
    expect(resolveCitizenMapView(manualLocation("patna")).center).toEqual(
      CITIZEN_MAP_DEFAULTS.center,
    );
  });

  it("falls back to defaults for an unknown district", () => {
    expect(resolveCitizenMapView(manualLocation("Nowhere"))).toEqual(
      CITIZEN_MAP_DEFAULTS,
    );
  });

  it("returns a stable default reference for the null path", () => {
    expect(resolveCitizenMapView(null)).toBe(CITIZEN_MAP_DEFAULTS);
  });
});
