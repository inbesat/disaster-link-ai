export interface VehicleAsset {
  id: string;
  name: string;
  type: 'boat' | 'truck' | 'ambulance' | 'helicopter';
  capacity: number; // people it can carry per trip
  speedKmh: number;
  lat: number;
  lng: number;
}

export interface EvacuationDemand {
  id: string;
  villageName: string;
  lat: number;
  lng: number;
  evacuees: number;
  priority: number; // 0-100, higher = more urgent
  assignedShelterId?: string;
}

export interface FleetAssignment {
  vehicleId: string;
  vehicleName: string;
  demandId: string;
  villageName: string;
  distanceKm: number;
  estimatedArrivalMin: number;
  tripsNeeded: number;
  evacueesCovered: number;
}

export interface FleetOptimizationResult {
  assignments: FleetAssignment[];
  totalVehiclesUsed: number;
  totalEvacueesCovered: number;
  unmetDemands: EvacuationDemand[];
  estimatedCompletionMin: number;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function optimizeFleetAssignment(
  vehicles: VehicleAsset[],
  demands: EvacuationDemand[]
): FleetOptimizationResult {
  const assignments: FleetAssignment[] = [];
  const unmetDemands: EvacuationDemand[] = [];

  // Sort demands by priority descending
  const sortedDemands = [...demands].sort((a, b) => b.priority - a.priority);
  const availableVehicles = [...vehicles];

  let totalEvacueesCovered = 0;
  let maxCompletionMin = 0;

  for (const demand of sortedDemands) {
    if (availableVehicles.length === 0) {
      unmetDemands.push(demand);
      continue;
    }

    let nearestVehicle: VehicleAsset | null = null;
    let minDistance = Infinity;
    let vehicleIndex = -1;

    for (let i = 0; i < availableVehicles.length; i++) {
      const v = availableVehicles[i];
      const dist = haversineKm(demand.lat, demand.lng, v.lat, v.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearestVehicle = v;
        vehicleIndex = i;
      }
    }

    if (nearestVehicle && vehicleIndex !== -1) {
      const distanceKm = minDistance;
      const speed = nearestVehicle.speedKmh > 0 ? nearestVehicle.speedKmh : 30; // fallback to 30km/h
      const estimatedArrivalMin = (distanceKm / speed) * 60;
      
      const tripsNeeded = Math.ceil(demand.evacuees / (nearestVehicle.capacity || 1));
      const evacueesCovered = demand.evacuees;
      
      // Rough estimate of completion time (arrival + round trips)
      const completionTimeMin = estimatedArrivalMin + (tripsNeeded * 2 * distanceKm / speed) * 60;
      if (completionTimeMin > maxCompletionMin) {
        maxCompletionMin = completionTimeMin;
      }

      assignments.push({
        vehicleId: nearestVehicle.id,
        vehicleName: nearestVehicle.name,
        demandId: demand.id,
        villageName: demand.villageName,
        distanceKm,
        estimatedArrivalMin,
        tripsNeeded,
        evacueesCovered,
      });

      totalEvacueesCovered += evacueesCovered;
      availableVehicles.splice(vehicleIndex, 1);
    }
  }

  return {
    assignments,
    totalVehiclesUsed: assignments.length,
    totalEvacueesCovered,
    unmetDemands,
    estimatedCompletionMin: maxCompletionMin,
  };
}
