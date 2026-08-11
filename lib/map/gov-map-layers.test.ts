// ---------------------------------------------------------------------
// lib/map/gov-map-layers.test.ts — Phase 8 · Step 2.
// Pins the seven-layer catalog, the per-layer defaults, and the mock
// GeoJSON builders so the AdvancedLayerControl and map canvas always
// agree on what "the layers" are.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import area from "@turf/area";
import { CITIZEN_SHELTERS } from "@/lib/map/citizen-shelters";
import {
  crowdReportsGeoJson,
  DEFAULT_GOV_LAYER_STATES,
  extremeScenarioFloodGeoJson,
  GOV_CROWD_REPORTS,
  GOV_EVACUATION_ROUTES,
  GOV_LAYER_COLORS,
  GOV_LAYER_LABELS,
  GOV_MAP_LAYER_KEYS,
  GOV_RESPONDER_POSITIONS,
  GOV_RESOURCE_DEPOTS,
  GOV_ROAD_CLOSURES,
  govFloodZonesGeoJson,
  govSheltersGeoJson,
  pointsToGeoJson,
  routesToGeoJson,
} from "./gov-map-layers";

describe("layer catalog", () => {
  it("defines exactly the seven spec'd layers", () => {
    expect(GOV_MAP_LAYER_KEYS).toEqual([
      "floodRiskZones",
      "shelters",
      "resourceDepots",
      "evacuationRoutes",
      "responderPositions",
      "roadClosures",
      "crowdReports",
    ]);
  });

  it("labels every layer and colours every layer", () => {
    for (const key of GOV_MAP_LAYER_KEYS) {
      expect(GOV_LAYER_LABELS[key].length).toBeGreaterThan(0);
      expect(GOV_LAYER_COLORS[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("ships defaults for every layer with 0–100 opacity", () => {
    for (const key of GOV_MAP_LAYER_KEYS) {
      const state = DEFAULT_GOV_LAYER_STATES[key];
      expect(state.opacity).toBeGreaterThanOrEqual(0);
      expect(state.opacity).toBeLessThanOrEqual(100);
      expect(typeof state.visible).toBe("boolean");
    }
  });

  it("defaults flood zones visible and crowd reports hidden", () => {
    expect(DEFAULT_GOV_LAYER_STATES.floodRiskZones.visible).toBe(true);
    expect(DEFAULT_GOV_LAYER_STATES.crowdReports.visible).toBe(false);
  });
});

describe("mock geometry builders", () => {
  it("builds a flood zone FeatureCollection of polygons", () => {
    const fc = govFloodZonesGeoJson();
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features.length).toBeGreaterThan(0);
    expect(fc.features.every((f) => f.geometry.type === "Polygon")).toBe(true);
  });

  it("builds shelters from the shared citizen shelter data", () => {
    const fc = govSheltersGeoJson();
    expect(fc.features.length).toBe(CITIZEN_SHELTERS.length);
    expect(fc.features[0].geometry.type).toBe("Point");
  });

  it("converts point lists to point features with names", () => {
    const fc = pointsToGeoJson(GOV_RESOURCE_DEPOTS);
    expect(fc.features).toHaveLength(4);
    expect(fc.features[0].properties?.name).toBe("NH-01 Staging Point");
    expect(fc.features[0].geometry.coordinates).toHaveLength(2);
  });

  it("converts route polylines to line features", () => {
    const fc = routesToGeoJson(GOV_EVACUATION_ROUTES);
    expect(fc.features).toHaveLength(3);
    expect(fc.features.every((f) => f.geometry.type === "LineString")).toBe(true);
    expect(fc.features[0].geometry.coordinates.length).toBeGreaterThanOrEqual(2);
  });

  it("exposes non-empty responder, closure and report sets", () => {
    expect(GOV_RESPONDER_POSITIONS.length).toBeGreaterThan(0);
    expect(GOV_ROAD_CLOSURES.length).toBeGreaterThan(0);
    expect(GOV_CROWD_REPORTS.length).toBeGreaterThan(0);
  });
});

describe("crowdReportsGeoJson (Phase 8 · Step 10 clustering source)", () => {
  it("generates the requested number of point features", () => {
    expect(crowdReportsGeoJson(0).features).toHaveLength(0);
    expect(crowdReportsGeoJson(3000).features).toHaveLength(3000);
  });

  it("keeps every report within ~7 km of the district centre", () => {
    const center = { lat: 25.594, lng: 85.137 };
    const fc = crowdReportsGeoJson(2000);
    for (const f of fc.features) {
      const [lng, lat] = f.geometry.coordinates;
      const dLat = (lat - center.lat) * 111;
      const dLng = (lng - center.lng) * 111 * Math.cos((center.lat * Math.PI) / 180);
      expect(Math.hypot(dLat, dLng)).toBeLessThan(7.5);
    }
  });

  it("is deterministic — the same count yields the same cloud", () => {
    expect(crowdReportsGeoJson(1500)).toEqual(crowdReportsGeoJson(1500));
  });
});

describe("extremeScenarioFloodGeoJson (Phase 8 · Step 9 compare pane)", () => {
  it("covers a larger area than the base flood zones", () => {
    const extreme = area(extremeScenarioFloodGeoJson());
    const base = area(govFloodZonesGeoJson());
    expect(extreme).toBeGreaterThan(base);
  });
});
