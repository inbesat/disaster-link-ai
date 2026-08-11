// ---------------------------------------------------------------------
// lib/mock-data/gov-districts.test.ts — Phase 7 · Step 10.
// The super-admin overview grid sorts districts by severity before
// rendering — these tests pin that ordering (and the label thresholds)
// so the State-HQ page always surfaces the worst district first.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  DISTRICT_SUMMARIES,
  formatCount,
  riskLevelFor,
  sortDistrictsByRisk,
} from "./gov-districts";

describe("riskLevelFor", () => {
  it("maps score bands to severity labels", () => {
    expect(riskLevelFor(92)).toBe("critical");
    expect(riskLevelFor(85)).toBe("critical");
    expect(riskLevelFor(81)).toBe("high");
    expect(riskLevelFor(70)).toBe("high");
    expect(riskLevelFor(64)).toBe("moderate");
    expect(riskLevelFor(50)).toBe("moderate");
    expect(riskLevelFor(20)).toBe("low");
  });
});

describe("sortDistrictsByRisk", () => {
  it("puts the highest-risk district first", () => {
    const sorted = sortDistrictsByRisk(DISTRICT_SUMMARIES);
    expect(sorted[0].name).toBe("Patna"); // 92
    expect(sorted[1].name).toBe("Bhagalpur"); // 81
    expect(sorted[2].name).toBe("Gaya"); // 64
  });

  it("does not mutate the input array", () => {
    const before = DISTRICT_SUMMARIES.map((d) => d.name);
    sortDistrictsByRisk(DISTRICT_SUMMARIES);
    expect(DISTRICT_SUMMARIES.map((d) => d.name)).toEqual(before);
  });

  it("breaks equal scores deterministically by evacuees then name", () => {
    const input = [
      { id: "b", name: "B", riskScore: 50, evacuees: 100, resourcesDeployed: 5, activeEvents: 1 },
      { id: "c", name: "C", riskScore: 50, evacuees: 300, resourcesDeployed: 5, activeEvents: 1 },
      { id: "a", name: "A", riskScore: 50, evacuees: 100, resourcesDeployed: 5, activeEvents: 1 },
    ];
    const sorted = sortDistrictsByRisk(input);
    expect(sorted.map((d) => d.id)).toEqual(["c", "a", "b"]);
  });
});

describe("formatCount", () => {
  it("formats Indian numbering (lakh-style separators)", () => {
    expect(formatCount(12840)).toBe("12,840");
    expect(formatCount(0)).toBe("0");
  });
});
