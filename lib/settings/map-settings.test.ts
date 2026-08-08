import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_MAP_SETTINGS,
  DRIP_MAP_SETTINGS_KEY,
  mergeMapSettings,
  readStoredMapSettings,
  writeStoredMapSettings,
} from "./map-settings";

// ---------------------------------------------------------------------
// lib/settings/map-settings.test.ts — Map & GIS Settings (Phase 3 · Step 1).
//
// Verifies the merge/sanitize layer that protects the shared map config:
// corrupt, partial or hostile localStorage snapshots can never break the
// MapSettings shape that the settings page and the /dashboard map consume.
// ---------------------------------------------------------------------

describe("mergeMapSettings", () => {
  it("returns shipped defaults for null / junk input", () => {
    expect(mergeMapSettings(null)).toEqual(DEFAULT_MAP_SETTINGS);
    expect(mergeMapSettings("corrupt")).toEqual(DEFAULT_MAP_SETTINGS);
    expect(mergeMapSettings(42)).toEqual(DEFAULT_MAP_SETTINGS);
  });

  it("applies a full valid snapshot verbatim", () => {
    const merged = mergeMapSettings({
      defaultView: { center: { lat: 25.6, lng: 85.1 }, zoom: 9, focusDistrict: "Patna" },
      layers: { floodZones: true, shelters: false, resources: false, evacRoutes: true, responderPositions: false, roadClosures: true, groundReports: true },
      display: { units: "imperial", coordinateFormat: "dms", basemapStyle: "satellite", showDistrictLabels: false, showSeverityHeat: true, showScaleBar: false },
      cache: { enabled: false, refreshInterval: "30s", cachedRegions: ["Patna"], cacheSizeMb: 88, sizeLimitMb: 2048 },
    });

    expect(merged.defaultView.center).toEqual({ lat: 25.6, lng: 85.1 });
    expect(merged.defaultView.zoom).toBe(9);
    expect(merged.defaultView.focusDistrict).toBe("Patna");
    expect(merged.layers.shelters).toBe(false);
    expect(merged.layers.evacRoutes).toBe(true);
    expect(merged.layers.responderPositions).toBe(false);
    expect(merged.display.units).toBe("imperial");
    expect(merged.display.coordinateFormat).toBe("dms");
    expect(merged.display.basemapStyle).toBe("satellite");
    expect(merged.display.showDistrictLabels).toBe(false);
    expect(merged.cache.enabled).toBe(false);
    expect(merged.cache.refreshInterval).toBe("30s");
    expect(merged.cache.cachedRegions).toEqual(["Patna"]);
    expect(merged.cache.cacheSizeMb).toBe(88);
    expect(merged.cache.sizeLimitMb).toBe(2048);
  });

  it("clamps zoom to the 1–20 rail and rejects unknown enums", () => {
    const merged = mergeMapSettings({
      defaultView: { center: { lat: 99, lng: -190 }, zoom: 9000, focusDistrict: null },
      display: { units: "nautical", coordinateFormat: "gridref", basemapStyle: "hologram" },
      cache: { refreshInterval: "hourly", cacheSizeMb: -5, sizeLimitMb: 999 },
    });

    expect(merged.defaultView.center.lat).toBe(99); // finite numbers pass
    expect(merged.defaultView.center.lng).toBe(-190);
    expect(merged.defaultView.zoom).toBe(20); // clamped at max rail
    expect(merged.defaultView.focusDistrict).toBeNull();
    expect(merged.display.units).toBe("metric"); // unknown → default
    expect(merged.display.coordinateFormat).toBe("dd"); // unknown → default
    expect(merged.display.basemapStyle).toBe("tactical_dark"); // unknown → default
    expect(merged.cache.refreshInterval).toBe("1m"); // unknown → default
    expect(merged.cache.cacheSizeMb).toBe(0); // negatives clamped to 0
    expect(merged.cache.sizeLimitMb).toBe(1024); // not on the whitelist → default
  });

  it("sanitizes layer/display booleans — non-boolean input falls back", () => {
    const merged = mergeMapSettings({
      layers: { floodZones: "yes", shelters: false },
      display: { showScaleBar: "on", showSeverityHeat: true },
    });

    expect(merged.layers.floodZones).toBe(true); // invalid → default
    expect(merged.layers.shelters).toBe(false); // valid
    expect(merged.display.showScaleBar).toBe(true); // invalid → default
    expect(merged.display.showSeverityHeat).toBe(true);
  });

  it("filters non-string cache regions", () => {
    const merged = mergeMapSettings({
      cache: { cachedRegions: ["Patna", 7, null, "Bihar"] },
    });
    expect(merged.cache.cachedRegions).toEqual(["Patna", "Bihar"]);
  });

  it("accepts the realtime WebSocket refresh cadence", () => {
    const merged = mergeMapSettings({
      cache: { refreshInterval: "realtime" },
    });
    expect(merged.cache.refreshInterval).toBe("realtime");
  });

  it("sanitizes hazard flood opacities to the 0–1 rail", () => {
    const merged = mergeMapSettings({
      hazards: {
        highlightCriticalZonesOnly: true,
        floodOpacities: { safe: -0.4, watch: 0.5, warning: 9, evacuate: 0.8 },
      },
    });

    expect(merged.hazards.highlightCriticalZonesOnly).toBe(true);
    expect(merged.hazards.floodOpacities.safe).toBe(0); // clamped at min rail
    expect(merged.hazards.floodOpacities.watch).toBe(0.5);
    expect(merged.hazards.floodOpacities.warning).toBe(1); // clamped at max rail
    expect(merged.hazards.floodOpacities.evacuate).toBe(0.8);
  });

  it("sanitizes performance booleans — Eco Mode persists only when boolean", () => {
    const merged = mergeMapSettings({
      performance: {
        animationsEnabled: false,
        terrain3d: false,
        ecoMode: true,
        bogus: "field",
      },
    });
    expect(merged.performance).toEqual({
      animationsEnabled: false,
      terrain3d: false,
      ecoMode: true,
    });

    const junk = mergeMapSettings({ performance: "oops" });
    expect(junk.performance).toEqual(DEFAULT_MAP_SETTINGS.performance);
  });

  it("falls back to default hazard values for junk input", () => {
    const merged = mergeMapSettings({
      hazards: { highlightCriticalZonesOnly: "yes", floodOpacities: "nope" },
    });
    expect(merged.hazards.highlightCriticalZonesOnly).toBe(false);
    expect(merged.hazards.floodOpacities).toEqual(
      DEFAULT_MAP_SETTINGS.hazards.floodOpacities
    );
  });

  it("sanitizes accessibility booleans", () => {
    const merged = mergeMapSettings({
      accessibility: { colorblindMode: true, highContrast: true, junk: 1 },
    });
    expect(merged.accessibility).toEqual({
      colorblindMode: true,
      highContrast: true,
    });

    const junk = mergeMapSettings({ accessibility: { colorblindMode: "x" } });
    expect(junk.accessibility.colorblindMode).toBe(false); // default
    expect(junk.accessibility.highContrast).toBe(false);
  });

  it("never shares mutable references with the received snapshot", () => {
    const input = {
      defaultView: { center: { lat: 1, lng: 2 }, zoom: 3, focusDistrict: "X" },
      layers: undefined,
      display: undefined,
      cache: undefined,
    };
    const merged = mergeMapSettings(input);
    // Mutating the merged result must not leak into a second merge of the
    // same input, nor into the shared defaults.
    merged.defaultView.center.lat = -999;
    const reMerged = mergeMapSettings(input);
    expect(reMerged.defaultView.center.lat).toBe(1);
    expect(DEFAULT_MAP_SETTINGS.defaultView.center.lat).toBe(22);
  });
});

describe("storage key", () => {
  it("is stable for cross-tab syncing", () => {
    expect(DRIP_MAP_SETTINGS_KEY).toBe("drip_map_settings_v1");
  });
});

describe("localStorage round-trip", () => {
  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
  });

  it("writes then reads the full settings snapshot unchanged", () => {
    const store = new Map<string, string | null>();
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => store.set(key, value),
      },
    };

    const snapshot = mergeMapSettings({
      display: { units: "imperial", coordinateFormat: "dms" },
      hazards: { highlightCriticalZonesOnly: true },
      performance: { ecoMode: true, animationsEnabled: false, terrain3d: false },
      accessibility: { colorblindMode: true },
      cache: { refreshInterval: "realtime", sizeLimitMb: 2048 },
    });

    writeStoredMapSettings(snapshot);
    const restored = readStoredMapSettings();

    expect(restored).toEqual(snapshot);
    expect(store.has(DRIP_MAP_SETTINGS_KEY)).toBe(true);
  });

  it("returns null when nothing is stored", () => {
    (globalThis as { window?: unknown }).window = {
      localStorage: { getItem: () => null, setItem: () => undefined },
    };
    expect(readStoredMapSettings()).toBeNull();
  });
});