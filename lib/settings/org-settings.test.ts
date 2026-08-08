import { afterEach, describe, expect, it } from "vitest";
import {
  cloneDefaultOrgSettings,
  DRIP_ORG_SETTINGS_KEY,
  mergeOrgSettings,
  readStoredOrgSettings,
  writeStoredOrgSettings,
} from "./org-settings";

describe("mergeOrgSettings", () => {
  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
  });

  it("returns full defaults for null and junk input", () => {
    const fresh = cloneDefaultOrgSettings();
    expect(mergeOrgSettings(null)).toEqual(fresh);
    expect(mergeOrgSettings("corrupt")).toEqual(fresh);
    expect(mergeOrgSettings(42)).toEqual(fresh);
  });

  it("populates sane defaults so the Admin UI is never blank", () => {
    const settings = mergeOrgSettings(null);
    expect(settings.districts.length).toBeGreaterThan(0);
    expect(settings.districts[0].name).toBe("Patna");
    expect(settings.districts[0].active).toBe(true);
    expect(settings.thresholds.d1.warningRain).toBe(100);
    expect(settings.thresholds.d1.criticalRain).toBe(200);
    expect(settings.params.shelterCapacityWarning).toBe(80);
    expect(settings.params.resourceLowStockThreshold).toBe(10);
    expect(settings.params.autoEvacuation).toBe(false);
  });

  it("applies a valid params snapshot verbatim", () => {
    const merged = mergeOrgSettings({
      params: {
        shelterCapacityWarning: 90,
        resourceLowStockThreshold: 25,
        autoEvacuation: true,
      },
    });
    expect(merged.params.shelterCapacityWarning).toBe(90);
    expect(merged.params.resourceLowStockThreshold).toBe(25);
    expect(merged.params.autoEvacuation).toBe(true);
  });

  it("clamps out-of-range params but keeps booleans strict", () => {
    const merged = mergeOrgSettings({
      params: {
        shelterCapacityWarning: 999,
        resourceLowStockThreshold: -5,
        autoEvacuation: "yes",
      },
    });
    expect(merged.params.shelterCapacityWarning).toBe(95);
    expect(merged.params.resourceLowStockThreshold).toBe(0);
    expect(merged.params.autoEvacuation).toBe(false);
  });

  it("merges thresholds and drops corrupt district entries", () => {
    const merged = mergeOrgSettings({
      districts: [
        {
          id: "x1",
          name: "Sitamarhi",
          state: "Bihar",
          centerLat: 26.6,
          centerLng: 85.5,
          active: true,
          geojsonActive: false,
        },
        "junk",
      ],
      thresholds: {
        x1: { warningRain: 75, criticalRain: 150, warningRiver: 2.0, criticalRiver: 3.1 },
      },
    });
    expect(merged.districts).toHaveLength(1);
    expect(merged.districts[0].name).toBe("Sitamarhi");
    expect(merged.districts[0].active).toBe(true);
    expect(merged.thresholds.x1.warningRain).toBe(75);
    expect(merged.thresholds.x1.criticalRiver).toBe(3.1);
  });

  it("falls back for non-numeric centers instead of throwing", () => {
    const merged = mergeOrgSettings({
      districts: [
        {
          id: "y1",
          name: "Y",
          state: "Z",
          centerLat: "bad",
          centerLng: 5,
          active: true,
          geojsonActive: false,
        },
      ],
    });
    expect(merged.districts[0].centerLat).toBe(0);
    expect(Number.isFinite(merged.districts[0].centerLat)).toBe(true);
  });

  it("persists and restores through a localStorage round-trip", () => {
    const store = new Map<string, string | null>();
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => store.set(key, value),
      },
    };

    const custom = cloneDefaultOrgSettings();
    custom.districts[0].name = "Patna North";
    custom.params.autoEvacuation = true;
    writeStoredOrgSettings(custom);
    const restored = readStoredOrgSettings();
    expect(restored).not.toBeNull();
    expect(restored && restored.districts[0].name).toBe("Patna North");
    expect(restored && restored.params.autoEvacuation).toBe(true);
    expect(store.has(DRIP_ORG_SETTINGS_KEY)).toBe(true);
  });
});