// ---------------------------------------------------------------------
// lib/demo/seeder.test.ts — Phase 2 · Step 4 · Demo seeder tests.
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import {
  activateDemoScenario,
  DEMO_SCENARIOS,
  DEMO_SCENARIO_LABEL,
  readStoredDemoScenario,
  readStoredDemoSeed,
  seedDemoData,
  type DemoScenarioKey,
} from "./seeder";

const KEYS: DemoScenarioKey[] = [
  "normal_day",
  "flood_watch",
  "evacuation_order",
  "critical_emergency",
];

describe("seedDemoData", () => {
  it("returns every collection for all four scenarios", () => {
    for (const key of KEYS) {
      const data = seedDemoData(key);
      expect(data.scenario).toBe(key);
      expect(data.affectedVillages.length).toBeGreaterThan(0);
      expect(data.shelters.length).toBeGreaterThan(0);
      expect(data.resources.length).toBeGreaterThan(0);
      expect(data.responders.length).toBeGreaterThan(0);
      expect(data.alerts.length).toBeGreaterThan(0);
    }
  });

  it("tags every record isDemo: true", () => {
    for (const key of KEYS) {
      const data = seedDemoData(key);
      const all = [
        ...data.affectedVillages,
        ...data.shelters,
        ...data.resources,
        ...data.responders,
        ...data.alerts,
      ];
      expect(all.every((item) => item.isDemo === true)).toBe(true);
    }
  });

  it("escalates severity across the four scenarios", () => {
    const counts = KEYS.map(
      (key) => seedDemoData(key).alerts.filter((a) => a.severity === "critical").length,
    );
    // Normal has 0 critical alerts; the last scenario has the most.
    expect(counts[0]).toBe(0);
    expect(counts[3]).toBeGreaterThan(counts[0]);
  });

  it("is deterministic — identical shape on every call", () => {
    const a = seedDemoData("critical_emergency");
    const b = seedDemoData("critical_emergency");
    expect(a).toEqual(b);
  });
});

describe("meta + storage", () => {
  it("exposes one droplet option per scenario with labels", () => {
    expect(DEMO_SCENARIOS.map((s) => s.key)).toEqual(KEYS);
    for (const { key, label } of DEMO_SCENARIOS) {
      expect(label).toBe(DEMO_SCENARIO_LABEL[key]);
    }
  });

  it("activateDemoScenario stores + reads back the dataset (window mocked)", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
      dispatchEvent: () => true,
    });

    const data = activateDemoScenario("flood_watch");
    expect(data.scenario).toBe("flood_watch");
    expect(readStoredDemoScenario()).toBe("flood_watch");
    expect(readStoredDemoSeed()?.scenario).toBe("flood_watch");

    vi.unstubAllGlobals();
  });
});