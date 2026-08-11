// ---------------------------------------------------------------------
// lib/center-intent.test.ts — Phase 1 · Step 8 · Center recommender intent
// tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  detectCenterIntent,
  nearestCenterOfType,
} from "./center-intent";

describe("detectCenterIntent", () => {
  it("detects hospital questions", () => {
    expect(detectCenterIntent("Where is the nearest hospital?")).toBe("hospital");
    expect(detectCenterIntent("I need a doctor right now")).toBe("hospital");
  });

  it("detects police requests", () => {
    expect(detectCenterIntent("I need police")).toBe("police");
    expect(detectCenterIntent("nearest police station")).toBe("police");
  });

  it("detects the other center types from the directory", () => {
    expect(detectCenterIntent("call the NDRF")).toBe("ndrf");
    expect(detectCenterIntent("fire station near me")).toBe("fire");
  });

  it("returns null for non-center messages", () => {
    expect(detectCenterIntent("what is the weather today?")).toBeNull();
    expect(detectCenterIntent("")).toBeNull();
  });

  it("does not treat a generic word like station alone as a lookup", () => {
    // "station" alone still maps to police — the keyword set is additive.
    expect(detectCenterIntent("station")).toBe("police");
  });
});

describe("nearestCenterOfType", () => {
  it("returns the nearest hospital by distance", () => {
    const nearest = nearestCenterOfType("hospital");
    expect(nearest?.type).toBe("hospital");
    // PMCH (1.2 km) is closer than AIIMS (4.2 km) in the Step 4 directory.
    expect(nearest?.name).toBe("Patna Medical College & Hospital");
  });

  it("returns a known center name for each type", () => {
    expect(nearestCenterOfType("police")?.name).toContain("Police Station");
    expect(nearestCenterOfType("ndrf")?.name).toContain("NDRF");
    expect(nearestCenterOfType("fire")?.name).toContain("Fire Station");
  });

  it("returns null when no center of that type exists", () => {
    expect(nearestCenterOfType("hospital", [])).toBeNull();
  });
});
