import { distance } from "@turf/distance";
import { point } from "@turf/helpers";

// ---------------------------------------------------------------------
// Resource Allocation optimizer — Phase 13.
// Pure math utilities for scoring demand and greedily assigning stock.
// ---------------------------------------------------------------------

export type AllocationCandidateResource = {
  id: string;
  name?: string;
  category: string;
  quantity: number;
  lat: number;
  lng: number;
};

export type AllocationDemand = {
  id: string;
  disasterEventId?: string;
  category: string;
  quantityNeeded: number;
  lat: number;
  lng: number;
  affectedPopulation?: number;
  severityRisk?: number; // 0..1
  accessibilityFactor?: number; // 0..1 (1 = fully reachable)
};

export type ProposedAllocation = {
  resourceId: string;
  resourceName?: string;
  category: string;
  demandId: string;
  disasterEventId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  quantityAllocated: number;
  priorityScore: number;
  estimatedArrival?: Date;
  status: "pending";
};

const POPULATION_WEIGHT = 30;
const SEVERITY_WEIGHT = 45;
const ACCESS_PENALTY_WEIGHT = 10;

/**
 * Priority score heavily weighted toward large affected populations and high
 * severity. Population enters on a log scale (so a 100k vs 200k area doesn't
 * double the score) while severity scales linearly and dominates the outcome.
 * A poor accessibility factor reduces the score, deprioritizing zones that
 * can't be reached right now. Range ≈ 0–100.
 */
export function calculatePriorityScore(
  affectedPopulation: number,
  severityRisk: number,
  accessibilityFactor: number,
): number {
  const populationComponent =
    Math.log10(Math.max(affectedPopulation, 0) + 1) * POPULATION_WEIGHT;
  const severityComponent = Math.max(0, Math.min(1, severityRisk)) * SEVERITY_WEIGHT;
  const accessPenalty =
    (1 - Math.max(0, Math.min(1, accessibilityFactor))) * ACCESS_PENALTY_WEIGHT;

  return Math.max(0, populationComponent + severityComponent - accessPenalty);
}

/** Rough ETA: convoy travel time at ~40 km/h + 30 min loading buffer. */
function estimateArrival(distanceKm: number): Date {
  const hours = distanceKm / 40 + 0.5;
  return new Date(Date.now() + hours * 3600 * 1000);
}

export type LockedAllocation = {
  resourceId: string;
  demandId: string;
};

/**
 * Greedy allocation: sorts demands by priority score (descending), then for
 * each demand assigns the nearest resource that has the requested category in
 * stock, consuming stock until the demand is met or all matching stock is gone.
 * Locked resource↔demand pairs are excluded from matching. Returns the list of
 * proposed allocations (status "pending").
 */
export async function runGreedyAllocation(
  availableResources: AllocationCandidateResource[],
  pendingDemands: AllocationDemand[],
  lockedAllocations: LockedAllocation[] = [],
): Promise<ProposedAllocation[]> {
  const pool = availableResources.map((r) => ({ ...r }));

  const lockedPairs = new Set(
    lockedAllocations.map((l) => `${l.resourceId}:${l.demandId}`),
  );

  const demands = pendingDemands
    .map((d) => ({
      ...d,
      priorityScore: calculatePriorityScore(
        d.affectedPopulation ?? 0,
        d.severityRisk ?? 0,
        d.accessibilityFactor ?? 1,
      ),
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const allocations: ProposedAllocation[] = [];

  for (const demand of demands) {
    const candidates = pool
      .filter(
        (r) =>
          r.category === demand.category &&
          r.quantity > 0 &&
          !lockedPairs.has(`${r.id}:${demand.id}`),
      )
      .map((r) => ({
        resource: r,
        distanceKm: distance(point([r.lng, r.lat]), point([demand.lng, demand.lat]), {
          units: "kilometers",
        }),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    let remaining = demand.quantityNeeded;
    for (const { resource, distanceKm } of candidates) {
      if (remaining <= 0) break;
      const allocated = Math.min(resource.quantity, remaining);
      resource.quantity -= allocated;
      remaining -= allocated;
      allocations.push({
        resourceId: resource.id,
        resourceName: resource.name,
        category: resource.category,
        demandId: demand.id,
        disasterEventId: demand.disasterEventId ?? "",
        originLat: resource.lat,
        originLng: resource.lng,
        destinationLat: demand.lat,
        destinationLng: demand.lng,
        quantityAllocated: allocated,
        priorityScore: demand.priorityScore,
        estimatedArrival: estimateArrival(distanceKm),
        status: "pending",
      });
    }
  }

  return allocations;
}
