// ---------------------------------------------------------------------
// lib/security/geospatial-security.ts — Phase 10: Map & Geospatial Data Security
//
// Coordinate validation, precision rounding, public location anonymization,
// search radius clamping, GeoJSON structure verification, and location access audit logging.
// ---------------------------------------------------------------------

export interface CoordinateCheck {
  valid: boolean;
  lat: number;
  lng: number;
  reason?: string;
}

export interface LocationAuditLog {
  userId: string;
  dataType: string;
  locationContext: string;
  timestamp: string;
}

export const locationAuditLogs: LocationAuditLog[] = [];

/**
 * Validates latitude (-90 to 90) and longitude (-180 to 180) bounds.
 */
export function validateCoordinates(lat: unknown, lng: unknown): CoordinateCheck {
  const numLat = Number(lat);
  const numLng = Number(lng);

  if (isNaN(numLat) || isNaN(numLng)) {
    return { valid: false, lat: 0, lng: 0, reason: "Latitude and longitude must be valid numbers." };
  }

  if (numLat < -90 || numLat > 90) {
    return { valid: false, lat: numLat, lng: numLng, reason: "Latitude must be between -90 and 90 degrees." };
  }

  if (numLng < -180 || numLng > 180) {
    return { valid: false, lat: numLat, lng: numLng, reason: "Longitude must be between -180 and 180 degrees." };
  }

  return { valid: true, lat: numLat, lng: numLng };
}

/**
 * Prevents coordinate precision leaks by rounding lat/lng.
 * Max 6 decimal places (~0.1m accuracy) for internal storage.
 */
export function roundCoordinatePrecision(
  lat: number,
  lng: number,
  decimals: number = 6,
): { lat: number; lng: number } {
  const factor = Math.pow(10, decimals);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor,
  };
}

/**
 * Anonymizes sensitive location coordinates for public API responses:
 *   • "coarse" (~1.1km accuracy / 2 decimals) for responder GPS or general public views
 *   • "neighborhood" (~110m accuracy / 3 decimals) for public shelter views
 *   • "precise" (~0.1m accuracy / 6 decimals) for authenticated district admin / commander views
 */
export function anonymizePublicLocation(
  lat: number,
  lng: number,
  precision: "coarse" | "neighborhood" | "precise" = "coarse",
): { lat: number; lng: number } {
  const decimals = precision === "coarse" ? 2 : precision === "neighborhood" ? 3 : 6;
  return roundCoordinatePrecision(lat, lng, decimals);
}

/**
 * Prevents overly large geospatial queries by capping search radius at max 100km.
 */
export function clampSearchRadius(radiusKm?: number, maxRadiusKm: number = 100): number {
  if (!radiusKm || radiusKm <= 0) return 10; // default 10km radius
  return Math.min(radiusKm, maxRadiusKm);
}

/**
 * Audit log for location data access: tracks WHO accessed WHAT location data and WHEN.
 */
export function logLocationAudit(
  userId: string,
  dataType: string,
  locationContext: string,
): void {
  locationAuditLogs.push({
    userId,
    dataType,
    locationContext,
    timestamp: new Date().toISOString(),
  });
  if (locationAuditLogs.length > 5000) {
    locationAuditLogs.shift();
  }
}

/**
 * Validates GeoJSON geometry structure and limits polygon vertex complexity (max 1000 vertices).
 */
export function validateGeoJSON(geojson: unknown): {
  valid: boolean;
  vertexCount: number;
  reason?: string;
} {
  if (!geojson || typeof geojson !== "object") {
    return { valid: false, vertexCount: 0, reason: "GeoJSON must be a valid object." };
  }

  const obj = geojson as { type?: string; coordinates?: unknown; features?: unknown[] };

  if (!obj.type || typeof obj.type !== "string") {
    return { valid: false, vertexCount: 0, reason: "GeoJSON is missing 'type' property." };
  }

  let vertexCount = 0;
  const countVertices = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    if (arr.length === 2 && typeof arr[0] === "number" && typeof arr[1] === "number") {
      vertexCount++;
      return;
    }
    for (const item of arr) {
      countVertices(item);
    }
  };

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const feat of obj.features) {
      if (feat && typeof feat === "object" && "geometry" in feat) {
        countVertices((feat as { geometry?: { coordinates?: unknown } }).geometry?.coordinates);
      }
    }
  } else if (obj.coordinates) {
    countVertices(obj.coordinates);
  }

  if (vertexCount > 1000) {
    return {
      valid: false,
      vertexCount,
      reason: `GeoJSON vertex count (${vertexCount}) exceeds limit of 1000 vertices.`,
    };
  }

  return { valid: true, vertexCount };
}
