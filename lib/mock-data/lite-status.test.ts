// ---------------------------------------------------------------------
// lib/mock-data/lite-status.test.ts — Phase 13 · Steps 3–4 · lite-status
// data tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import type { SafetyStatus } from "@/lib/mock-data/hazard-zones";
import {
  LITE_DISTRICT,
  RISK_LABELS,
  getLiteStatus,
} from "./lite-status";

describe("getLiteStatus", () => {
  const status = getLiteStatus();

  it("reports the registered demo district (Patna)", () => {
    expect(status.district).toBe(LITE_DISTRICT);
  });

  it("derives the risk from the shared hazard table (Patna = WATCH)", () => {
    expect(status.risk).toBe("WATCH");
    expect(status.riskLabel).toBe("YELLOW ALERT — STAY VIGILANT");
    expect(status.riskSmsWord).toBe("YELLOW ALERT");
  });

  it("always picks a non-full shelter as the nearest recommendation", () => {
    // Danapur Relief Camp is 450/450 (full) in the mock table and must
    // never be the recommended shelter.
    expect(status.shelter.occupancy).toBeLessThan(status.shelter.capacity);
    expect(status.shelter.name).toBe("Patna Central Community Hall");
  });

  it("computes a sensible distance to the district centre", () => {
    expect(status.shelterDistanceKm).toBeGreaterThan(0);
    expect(status.shelterDistanceKm).toBeLessThan(10);
    expect(status.shelterDistanceKm).toBeCloseTo(3.1, 0);
  });

  it("carries a shelter phone + the four emergency numbers", () => {
    expect(status.shelterPhone).toMatch(/^\d{4}-\d{7}$/);
    expect(status.emergencyNumbers).toHaveLength(4);
    expect(status.emergencyNumbers.map((n) => n.number)).toEqual([
      "1070",
      "100",
      "108",
      "101",
    ]);
  });
});

describe("RISK_LABELS", () => {
  it("has a label for every citizen SafetyStatus", () => {
    const statuses: SafetyStatus[] = ["SAFE", "WATCH", "PREPARE", "EVACUATE"];
    for (const key of statuses) {
      expect(RISK_LABELS[key]).toBeDefined();
      expect(RISK_LABELS[key].smsWord).toContain("ALERT");
    }
  });

  it("maps the most severe status to RED ALERT", () => {
    expect(RISK_LABELS.EVACUATE.label).toContain("RED ALERT");
  });
});
