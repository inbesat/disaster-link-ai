// ---------------------------------------------------------------------
// lib/fm/serialize.ts — Phase 26 · FM station wire-format helpers.
//
// Prisma returns `lat`/`lng` as Prisma.Decimal (with `coverage_area` as an
// Unsupported type that serialises as an opaque object). This module maps
// rows into the plain JSON shape consumed by the admin UI and the
// broadcast lookup — numbers, not Decimal wrappers.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";

export type FmStationDTO = {
  id: string;
  name: string;
  frequency: string;
  city: string;
  state: string;
  callSign: string | null;
  coverageRadiusKm: number;
  lat: number | null;
  lng: number | null;
  operator: string | null;
  type: string;
  emergencyApiEndpoint: string | null;
  emergencyContactPhone: string | null;
  rdsEnabled: boolean;
  rdsApiEndpoint: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Injected by the coverage lookup (/api/fm/coverage) — distance in km. */
  distance_km?: number;
};

/** Map a Prisma row into a plain JSON-safe DTO. */
export function serializeFmStation(row: FmStation): FmStationDTO {
  return {
    id: row.id,
    name: row.name,
    frequency: row.frequency,
    city: row.city,
    state: row.state,
    callSign: row.callSign,
    coverageRadiusKm: row.coverageRadiusKm,
    lat: row.lat !== null ? Number(row.lat) : null,
    lng: row.lng !== null ? Number(row.lng) : null,
    operator: row.operator,
    type: row.type,
    emergencyApiEndpoint: row.emergencyApiEndpoint,
    emergencyContactPhone: row.emergencyContactPhone,
    rdsEnabled: row.rdsEnabled,
    rdsApiEndpoint: row.rdsApiEndpoint,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Map a Prisma Decimal pair into plain numbers (or null). */
export function toCoords(
  lat: unknown,
  lng: unknown,
): { lat: number | null; lng: number | null } {
  const num = (v: unknown): number | null =>
    typeof v === "object" && v !== null && "toNumber" in v
      ? Number((v as { toNumber(): number }).toNumber())
      : typeof v === "number"
        ? v
        : null;
  const latN = num(lat);
  const lngN = num(lng);
  return {
    lat: latN !== null && Number.isFinite(latN) ? latN : null,
    lng: lngN !== null && Number.isFinite(lngN) ? lngN : null,
  };
}
