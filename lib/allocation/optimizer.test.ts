// Phase 13 — resource allocation optimization tests: priority scoring,
// greedy assignment, stock depletion, and locked (manual override) pairs.
import { describe, it, expect } from "vitest";
import {
  calculatePriorityScore,
  runGreedyAllocation,
  type AllocationCandidateResource,
  type AllocationDemand,
} from "./optimizer";

const boats: AllocationCandidateResource = {
  id: "boat-a",
  name: "Boat A",
  category: "boat",
  quantity: 5,
  lat: 25.5,
  lng: 85.1,
};

const farBoats: AllocationCandidateResource = {
  id: "boat-far",
  name: "Boat Far",
  category: "boat",
  quantity: 10,
  lat: 26.5,
  lng: 86.0,
};

const demand: AllocationDemand = {
  id: "village-1",
  category: "boat",
  quantityNeeded: 6,
  lat: 25.55,
  lng: 85.15,
  affectedPopulation: 120000,
  severityRisk: 0.9,
  accessibilityFactor: 0.8,
};

describe("calculatePriorityScore (Phase 13)", () => {
  it("scores higher for larger affected populations", () => {
    const low = calculatePriorityScore(1_000, 0.5, 1);
    const high = calculatePriorityScore(500_000, 0.5, 1);
    expect(high).toBeGreaterThan(low);
  });

  it("scores higher for higher severity", () => {
    const low = calculatePriorityScore(10_000, 0.2, 1);
    const high = calculatePriorityScore(10_000, 0.9, 1);
    expect(high).toBeGreaterThan(low);
  });

  it("penalizes zones that are hard to reach", () => {
    const reachable = calculatePriorityScore(10_000, 0.5, 1);
    const unreachable = calculatePriorityScore(10_000, 0.5, 0);
    expect(reachable).toBeGreaterThan(unreachable);
  });

  it("never returns a negative score", () => {
    expect(calculatePriorityScore(-5, 0, 0)).toBeGreaterThanOrEqual(0);
  });

  it("clamps severity and accessibility to the 0..1 range", () => {
    const clamped = calculatePriorityScore(10_000, 2.5, -1);
    const sane = calculatePriorityScore(10_000, 1, 0);
    expect(clamped).toBe(sane);
  });
});

describe("runGreedyAllocation (Phase 13)", () => {
  it("assigns the nearest matching resource first", async () => {
    const allocations = await runGreedyAllocation([farBoats, boats], [demand]);
    expect(allocations[0].resourceId).toBe("boat-a");
    expect(allocations).toHaveLength(2);
  });

  it("consumes stock until the demand is met", async () => {
    const allocations = await runGreedyAllocation([boats, farBoats], [demand]);
    const total = allocations.reduce((sum, a) => sum + a.quantityAllocated, 0);
    expect(total).toBe(6); // 5 from Boat A + 1 from Boat Far
  });

  it("returns nothing when the category has no stock", async () => {
    const allocations = await runGreedyAllocation(
      [{ ...boats, category: "medical" }],
      [demand],
    );
    expect(allocations).toEqual([]);
  });

  it("leaves unmet demand without an allocation", async () => {
    const allocations = await runGreedyAllocation(
      [{ ...boats, quantity: 2 }],
      [{ ...demand, quantityNeeded: 10 }],
    );
    expect(allocations).toHaveLength(1);
    expect(allocations[0].quantityAllocated).toBe(2);
  });

  it("sorts demands by priority score (descending)", async () => {
    const first: AllocationDemand = {
      ...demand,
      id: "low",
      affectedPopulation: 1_000,
      severityRisk: 0.1,
    };
    const second: AllocationDemand = {
      ...demand,
      id: "high",
      affectedPopulation: 500_000,
      severityRisk: 1,
    };
    const allocations = await runGreedyAllocation(
      [
        { ...boats, quantity: 1 },
        { ...farBoats, quantity: 1 },
      ],
      [first, second],
    );
    expect(allocations[0].demandId).toBe("high");
  });

  it("excludes locked (manually overridden) pairs", async () => {
    const allocations = await runGreedyAllocation(
      [boats],
      [demand],
      [{ resourceId: "boat-a", demandId: "village-1" }],
    );
    expect(allocations).toEqual([]);
  });

  it("records origin/destination coordinates for the deployment tracker", async () => {
    const allocations = await runGreedyAllocation([boats], [demand]);
    const a = allocations[0];
    expect(a.originLat).toBe(boats.lat);
    expect(a.originLng).toBe(boats.lng);
    expect(a.destinationLat).toBe(demand.lat);
    expect(a.destinationLng).toBe(demand.lng);
    expect(a.status).toBe("pending");
  });
});
