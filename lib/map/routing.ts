import { lineString } from "@turf/helpers";
import { distance } from "@turf/distance";
import { booleanIntersects } from "@turf/boolean-intersects";
import { nearestPointOnLine } from "@turf/nearest-point-on-line";
import type { Feature, LineString, Polygon } from "geojson";

export type EvacuationRoute = {
  /** The path geometry — OSRM driving route, or a straight-line fallback. */
  geometry: Feature<LineString>;
  /** Route length in meters. */
  distanceMeters: number;
  /** Estimated driving time in seconds. */
  durationSeconds: number;
};

/**
 * Resolve a driving route between two points using the free public OSRM API.
 * coordinates are (lng, lat) order.
 *
 * Falls back to a straight-line GeoJSON LineString (with a distance-based
 * duration estimate) if the API is unreachable or returns no route, so the
 * caller always receives a usable path.
 */
export async function getEvacuationRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
): Promise<EvacuationRoute> {
  const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`OSRM responded with status ${response.status}`);

    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{
        // OSRM returns a raw GeoJSON geometry (not a Feature wrapper).
        geometry: LineString;
        distance: number;
        duration: number;
      }>;
    };

    if (data.code !== "Ok" || !data.routes?.[0]) {
      throw new Error("OSRM returned no route.");
    }

    const route = data.routes[0];
    return {
      // Wrap the raw OSRM geometry in a Feature so the shape matches the
      // straight-line fallback below (consistent `geometry` contract).
      geometry: {
        type: "Feature",
        properties: {},
        geometry: route.geometry,
      },
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch (error) {
    console.warn("[routing] OSRM lookup failed — using straight-line fallback.", error);

    // Straight-line fallback + a conservative ~35 km/h travel estimate.
    const geometry = lineString([
      [startLng, startLat],
      [endLng, endLat],
    ]);
    const origin = { type: "Point" as const, coordinates: [startLng, startLat] };
    const destination = { type: "Point" as const, coordinates: [endLng, endLat] };
    const distanceMeters = distance(origin, destination, { units: "kilometers" }) * 1000;
    const avgSpeedMs = 35_000 / 3600; // 35 km/h
    const durationSeconds = Math.round(distanceMeters / avgSpeedMs);

    return { geometry, distanceMeters, durationSeconds };
  }
}

export type RouteSafety = {
  isSafe: boolean;
  warnings: string[];
};

export type RoadClosureInput = {
  id: string;
  lat: number;
  lng: number;
  reason: string;
  isActive: boolean;
};

/**
 * Validate an evacuation route against the current hazard picture.
 *
 * - Flags the route if it crosses any flood polygon flagged as critical /
 *   evacuate (turf `booleanIntersects`).
 * - Flags the route if any ACTIVE road closure point lies within ~150 m of the
 *   path (turf `nearestPointOnLine` + distance).
 *
 * Returns `{ isSafe, warnings }` — safe means no flood crossings and no
 * blocked road segments.
 */
export function validateRouteSafety(
  routeGeoJSON: Feature<LineString>,
  floodPolygonsGeoJSON: Feature<Polygon>[],
  roadClosures: RoadClosureInput[] = [],
): RouteSafety {
  const warnings: string[] = [];

  // 1. Flood-zone crossings.
  for (const polygon of floodPolygonsGeoJSON) {
    const riskLevel = String(
      polygon.properties?.riskLevel ?? polygon.properties?.severity ?? "",
    );
    const critical = ["critical", "evacuate"].includes(riskLevel.toLowerCase());
    const intersects = booleanIntersects(routeGeoJSON, polygon);
    if (intersects && critical) {
      warnings.push(`Route crosses a critical flood zone (${riskLevel}).`);
    } else if (intersects) {
      warnings.push(`Route passes through a ${riskLevel} flood zone.`);
    }
  }

  // 2. Active road closures near the path.
  const thresholdMeters = 150;
  for (const closure of roadClosures) {
    if (!closure.isActive) continue;
    const nearest = nearestPointOnLine(routeGeoJSON, {
      type: "Point",
      coordinates: [closure.lng, closure.lat],
    });
    const metersAway =
      distance(
        { type: "Point", coordinates: [closure.lng, closure.lat] },
        { type: "Point", coordinates: nearest.geometry.coordinates },
        { units: "kilometers" },
      ) * 1000;
    if (metersAway <= thresholdMeters) {
      warnings.push(`Road blocked near the route: ${closure.reason || "road closure"}.`);
    }
  }

  return {
    isSafe: warnings.length === 0,
    warnings,
  };
}
