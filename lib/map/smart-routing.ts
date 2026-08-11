// ---------------------------------------------------------------------
// lib/map/smart-routing.ts — Phase 1 · Step 5 · Smart Route Evaluation
// Engine.
//
// Generates three distinct evacuation route options between an origin and
// a destination:
//
//   1. recommended — the SAFEST option. Steers the direct path away from
//      the flood-zone centroid (heavily penalises flooded roads), so it
//      bows around the danger rather than through it.
//   2. shortest    — the direct OSRM route (or a straight-line fallback),
//      fastest distance, no flood avoidance.
//   3. alternative — a backup route: a bow on the opposite side, with its
//      own generated flood risk.
//
// Every option carries its geometry, distance, ETA and a *generated*
// flood_risk_level (low/medium/high) computed by sampling the path against
// the flood polygons — so the caller can rank routes without extra work.
//
// The OSRM query is delegated to getEvacuationRoute (same public endpoint
// + straight-line fallback the rest of the app uses); the two bowed routes
// are built locally from quadratic Béziers so they never require the
// network and are fully unit-testable.
// ---------------------------------------------------------------------

import { lineString } from "@turf/helpers";
import { length as turfLength } from "@turf/length";
import { along } from "@turf/along";
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { booleanIntersects } from "@turf/boolean-intersects";
import { centroid } from "@turf/centroid";
import { distance } from "@turf/distance";
import { getEvacuationRoute } from "./routing";
import type { Feature, LineString, Polygon, Position } from "geojson";

export type SmartRouteKind = "recommended" | "shortest" | "alternative";

/** Generated flood risk for a route path. */
export type FloodRiskLevel = "low" | "medium" | "high";

export type SmartRouteOption = {
  kind: SmartRouteKind;
  label: string;
  geometry: Feature<LineString>;
  distanceMeters: number;
  etaMinutes: number;
  floodRiskLevel: FloodRiskLevel;
};

/** Walking evacuation speed used for ETA on locally-built routes. */
export const EVACUATION_SPEED_KMH = 5;

/** How far the recommended route bows away from a flood zone, in km. */
export const RECOMMENDED_BOW_KM = 2;

/** Opposite-side bow for the backup route, in km. */
export const ALTERNATIVE_BOW_KM = 1.2;

/**
 * The main entry point — evaluates the three route options between two
 * points. `floodPolygons` are optional GeoJSON polygons; when provided the
 * recommended route steers around their centroid and every option gets a
 * generated flood risk level.
 */
export async function generateSmartRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  floodPolygons: Feature<Polygon>[] = [],
): Promise<SmartRouteOption[]> {
  const start: Position = [startLng, startLat];
  const end: Position = [endLng, endLat];

  // 1. Shortest — the direct OSRM route (road-aware) with a straight-line
  // fallback, exactly like the rest of the app.
  const direct = await getEvacuationRoute(startLng, startLat, endLng, endLat);
  const shortest: SmartRouteOption = {
    kind: "shortest",
    label: "Shortest · Fastest",
    geometry: direct.geometry,
    distanceMeters: Math.round(direct.distanceMeters),
    etaMinutes: Math.max(1, Math.round(direct.durationSeconds / 60)),
    floodRiskLevel: computeFloodRiskLevel(direct.geometry, floodPolygons),
  };

  // 2. Recommended — the SAFEST option. We evaluate several bow
  // directions (away from the flood centroid + both perpendiculars) at a
  // few bow distances and keep the candidate with the lowest generated
  // flood risk — i.e. flooded roads are penalised heavily, not visited.
  const recommendedGeometry = safestBowRoute(
    start,
    end,
    floodPolygons,
    [RECOMMENDED_BOW_KM, 3, 4],
  );

  // 3. Alternative — bow to the opposite side for a genuinely distinct
  // backup path.
  const perpendicular = perpendicularDirection(start, end);
  const alternativeGeometry = bowRoute(
    start,
    end,
    perpendicular,
    -ALTERNATIVE_BOW_KM,
    24,
  );

  const recommended: SmartRouteOption = buildLocalRoute(
    "recommended",
    "AI Recommended · Safest",
    recommendedGeometry,
    floodPolygons,
  );
  const alternative: SmartRouteOption = buildLocalRoute(
    "alternative",
    "Alternative · Backup",
    alternativeGeometry,
    floodPolygons,
  );

  return [recommended, shortest, alternative];
}

/** Wrap a locally-built geometry with distance/ETA/risk derived from it. */
function buildLocalRoute(
  kind: SmartRouteKind,
  label: string,
  geometry: Feature<LineString>,
  floodPolygons: Feature<Polygon>[],
): SmartRouteOption {
  const distanceMeters = Math.round(turfLength(geometry) * 1000);
  return {
    kind,
    label,
    geometry,
    distanceMeters,
    etaMinutes: estimateWalkingEta(distanceMeters),
    floodRiskLevel: computeFloodRiskLevel(geometry, floodPolygons),
  };
}

/** ETA from distance at the walking evacuation speed (min, floor 1). */
export function estimateWalkingEta(distanceMeters: number): number {
  const minutes = distanceMeters / 1000 / EVACUATION_SPEED_KMH * 60;
  return Math.max(1, Math.round(minutes));
}

/**
 * Unit direction the recommended route should bow toward: away from the
 * centroid of the nearest flood polygon. Falls back to the perpendicular
 * of the direct path when no flood zone exists or the direct line never
 * intersects one.
 */
export function floodAvoidanceDirection(
  start: Position,
  end: Position,
  floodPolygons: Feature<Polygon>[],
): Position {
  const line = lineString([start, end]);
  const mid = midpoint(start, end);

  const intersecting = floodPolygons.filter((poly) =>
    booleanIntersects(line, poly),
  );
  const candidates = intersecting.length > 0 ? intersecting : floodPolygons;

  let nearest: Position | null = null;
  let nearestKm = Infinity;
  for (const poly of candidates) {
    const c = centroid(poly).geometry.coordinates as Position;
    const km = distance({ type: "Point", coordinates: mid }, { type: "Point", coordinates: c });
    if (km < nearestKm) {
      nearestKm = km;
      nearest = c;
    }
  }

  if (nearest) {
    const away = normalize([mid[0] - nearest[0], mid[1] - nearest[1]]);
    if (away) return away;
  }

  return perpendicularDirection(start, end);
}

/**
 * Evaluate alternative bows (away-from-flood + both perpendiculars, at the
 * given bow distances) and return the single geometry with the LOWEST
 * generated flood risk — the "safest" route. Ties go to the shorter bow.
 */
export function safestBowRoute(
  start: Position,
  end: Position,
  floodPolygons: Feature<Polygon>[],
  bowDistancesKm: number[],
): Feature<LineString> {
  const away = floodAvoidanceDirection(start, end, floodPolygons);
  const perpendicular = perpendicularDirection(start, end);

  const candidates: Array<{ dir: Position; bowKm: number; geometry: Feature<LineString> }> = [];
  for (const bowKm of bowDistancesKm) {
    // Away direction (+ both perpendiculars as fallbacks).
    for (const dir of [away, perpendicular, [-perpendicular[0], -perpendicular[1]]]) {
      candidates.push({ dir, bowKm, geometry: bowRoute(start, end, dir, bowKm) });
    }
  }

  let best = candidates[0];
  for (const candidate of candidates) {
    const bestRisk = computeFloodRiskLevel(best.geometry, floodPolygons);
    const candidateRisk = computeFloodRiskLevel(candidate.geometry, floodPolygons);
    const rank = riskRank(candidateRisk);
    if (rank < riskRank(bestRisk)) {
      best = candidate;
    } else if (rank === riskRank(bestRisk) && candidate.bowKm < best.bowKm) {
      best = candidate;
    }
  }
  return best.geometry;
}

/** "low" (0) < "medium" (1) < "high" (2) for comparisons. */
function riskRank(level: FloodRiskLevel): number {
  return level === "low" ? 0 : level === "medium" ? 1 : 2;
}

/**
 * Left-of-travel perpendicular to the direct path. If the direct path is
 * degenerate, returns a vertical direction.
 */
export function perpendicularDirection(
  start: Position,
  end: Position,
): Position {
  const dir = normalize([end[0] - start[0], end[1] - start[1]]);
  return dir ? [-dir[1], dir[0]] : [0, 1];
}

/** Build a quadratic Bézier curve from start → control (the bow apex) →
 * end, sampled into `steps` points. The bow apex is the route midpoint
 * offset along `dir` by `bowKm`.
 */
export function bowRoute(
  start: Position,
  end: Position,
  dir: Position,
  bowKm: number,
  steps = 24,
): Feature<LineString> {
  const mid = midpoint(start, end);
  // Approx km-per-degree at this latitude (111 km/° for lat, cosine-scaled
  // for lng) so the bow distance is roughly correct anywhere.
  const avgLat = (start[1] + end[1]) / 2;
  const lngKmPerDeg = 111 * Math.cos((avgLat * Math.PI) / 180);
  const control: Position = [
    mid[0] + (dir[0] * bowKm) / lngKmPerDeg,
    mid[1] + (dir[1] * bowKm) / 111,
  ];

  const coords: Position[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    coords.push([
      u * u * start[0] + 2 * u * t * control[0] + t * t * end[0],
      u * u * start[1] + 2 * u * t * control[1] + t * t * end[1],
    ]);
  }
  return lineString(coords);
}

/**
 * Sample a route every ~500 m and count what fraction of those points fall
 * inside any flood polygon. 0 % → low, < 25 % → medium, otherwise high.
 */
export function computeFloodRiskLevel(
  geometry: Feature<LineString>,
  floodPolygons: Feature<Polygon>[],
): FloodRiskLevel {
  if (floodPolygons.length === 0) return "low";

  const lengthMeters = turfLength(geometry) * 1000;
  const stepMeters = 500;
  let inside = 0;
  let total = 0;
  for (let d = 0; d <= lengthMeters; d += stepMeters) {
    const sample = along(geometry, Math.min(d, lengthMeters), { units: "meters" });
    total += 1;
    if (floodPolygons.some((poly) => booleanPointInPolygon(sample, poly))) {
      inside += 1;
    }
  }

  if (total === 0) return "low";
  const fraction = inside / total;
  if (fraction === 0) return "low";
  if (fraction < 0.25) return "medium";
  return "high";
}

function midpoint(a: Position, b: Position): Position {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

/** Normalise a vector; returns null for the zero vector. */
function normalize(v: Position): Position | null {
  const len = Math.hypot(v[0], v[1]);
  if (len === 0) return null;
  return [v[0] / len, v[1] / len];
}
