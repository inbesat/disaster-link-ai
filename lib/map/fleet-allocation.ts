/**
 * Fleet sizing for an evacuation convoy.
 *
 * Assumptions:
 * - A standard rescue bus carries 40 people.
 * - An NDRF rescue boat carries 10 people.
 * - Routes longer than 2 hours cannot efficiently make multiple round trips,
 *   so we conservatively scale the fleet (no time-saving re-use).
 */
const BUS_CAPACITY = 40;
const BOAT_CAPACITY = 10;
const SINGLE_TRIP_LIMIT_SECONDS = 2 * 60 * 60; // 2 hours

export type FleetRequirements = {
  busesNeeded: number;
  boatsNeeded: number;
  /** Estimated total convoy time in hours (clamped to >= the trip). */
  estimatedTotalTimeH: number;
};

export function calculateFleetRequirements(
  totalEvacuees: number,
  routeDurationSeconds: number,
): FleetRequirements {
  const people = Math.max(0, totalEvacuees);
  const oneWayH = Math.max(0, routeDurationSeconds) / 3600;

  // Size vehicles to move everyone in a single shuttle.
  const busesNeeded = Math.ceil(people / BUS_CAPACITY);
  const boatsNeeded = Math.ceil(people / BOAT_CAPACITY);

  // Routes longer than 2 h prevent vehicles from making quick multiple trips,
  // so they must absorb a full return leg before the convoy is "free".
  const longHaul = oneWayH > SINGLE_TRIP_LIMIT_SECONDS / 3600;
  const tripTimeH = longHaul
    ? oneWayH * 2 // outbound + full return shuttle
    : oneWayH + Math.min(0.5, oneWayH * 0.25); // small load/return margin

  return {
    busesNeeded,
    boatsNeeded,
    estimatedTotalTimeH: Number(tripTimeH.toFixed(1)),
  };
}
