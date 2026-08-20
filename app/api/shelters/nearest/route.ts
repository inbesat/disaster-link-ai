import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/shelters/nearest?lat=..&lng=..&limit=3
 *
 * Nearest AVAILABLE shelters using a real PostGIS geospatial query
 * (`location <-> point` GiST kNN ordering). Falls back to returning an
 * empty array when the PostGIS column is NULL/unseeded, letting the caller
 * use its client-side (Turf) fallback.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const limit = Math.min(
    10,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 3),
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { ok: false, error: "lat/lng are required." },
      { status: 400 },
    );
  }

  try {
    interface PostgisShelterRow {
      id: string;
      name: string;
      district: string | null;
      lat: number;
      lng: number;
      capacity: number;
      current_occupancy: number;
      status: string;
      facilities: Record<string, boolean> | null;
      distance_km: number;
    }

    const rows = await prisma.$queryRaw<PostgisShelterRow[]>`
      SELECT
        id, name, district, lat, lng, capacity, current_occupancy, status, facilities,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) / 1000 AS distance_km
      FROM public.shelters
      WHERE status <> 'full' AND location IS NOT NULL
      ORDER BY location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      LIMIT ${limit}
    `;

    const shelters = rows.map((row) => ({
      id: String(row.id),
      name: String(row.name ?? ""),
      district: row.district ? String(row.district) : null,
      lat: Number(row.lat),
      lng: Number(row.lng),
      capacity: Number(row.capacity),
      currentOccupancy: Number(row.current_occupancy),
      status: String(row.status ?? "open"),
      facilities: row.facilities ? (row.facilities as Record<string, boolean>) : null,
      distance_km: Number(row.distance_km),
    }));

    return NextResponse.json({ ok: true, shelters, source: "postgis" });
  } catch (error: unknown) {
    console.error("[postgis] nearest-shelter query failed:", error);
    return NextResponse.json(
      { ok: false, shelters: [], source: "postgis" },
      { status: 200 },
    );
  }
}
