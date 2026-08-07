// Phase 8 — optimal shelter assignment tests: fleet sizing for evacuation
// convoys (buses at 40 pax, boats at 10 pax, long-haul return-leg scaling).
import { describe, it, expect } from "vitest";
import { calculateFleetRequirements } from "./fleet-allocation";

describe("calculateFleetRequirements (Phase 8)", () => {
  it("sizes buses at 40 people each", () => {
    expect(calculateFleetRequirements(80, 1800).busesNeeded).toBe(2);
    expect(calculateFleetRequirements(1, 1800).busesNeeded).toBe(1);
  });

  it("sizes boats at 10 people each", () => {
    expect(calculateFleetRequirements(25, 1800).boatsNeeded).toBe(3);
    expect(calculateFleetRequirements(50, 1800).boatsNeeded).toBe(5);
  });

  it("estimates a short-haul convoy time with a small load margin", () => {
    // 30 min one-way → ~0.5 h + margin, not a full return leg.
    const result = calculateFleetRequirements(40, 1800);
    expect(result.estimatedTotalTimeH).toBe(0.6);
  });

  it("doubles the return leg for routes longer than 2 hours", () => {
    // 3 h one-way → 6 h total (outbound + full return shuttle).
    const result = calculateFleetRequirements(100, 3 * 3600);
    expect(result.estimatedTotalTimeH).toBe(6);
  });

  it("clamps negative or zero inputs to an empty fleet", () => {
    const result = calculateFleetRequirements(-5, -100);
    expect(result.busesNeeded).toBe(0);
    expect(result.boatsNeeded).toBe(0);
    expect(result.estimatedTotalTimeH).toBe(0);
  });

  it("scales the fleet linearly with evacuee count", () => {
    const small = calculateFleetRequirements(40, 3600);
    const large = calculateFleetRequirements(400, 3600);
    expect(large.busesNeeded).toBe(small.busesNeeded * 10);
    expect(large.boatsNeeded).toBe(small.boatsNeeded * 10);
  });
});
