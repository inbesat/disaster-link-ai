import { NextRequest, NextResponse } from "next/server";
import { getFloodPrediction } from "@/lib/ml-client";
import { DISASTER_TYPES, type DisasterType } from "@/lib/disasters/disaster-types";

export const dynamic = "force-dynamic";

// Floodplains typically sit ~25-40m ASL; used when the caller has no elevation.
const DEFAULT_ELEVATION_M = 30;

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const rainfall = Number(request.nextUrl.searchParams.get("rainfall"));
  const elevationParam = request.nextUrl.searchParams.get("elevation");
  const saturationParam = request.nextUrl.searchParams.get("saturation");
  const typeParam = request.nextUrl.searchParams.get("disasterType");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Missing or invalid 'lat' / 'lng' query parameters." },
      { status: 400 },
    );
  }

  // Multi-hazard aware: accept any supported disaster type. The current ML
  // model is flood-specific (XGBoost); per-hazard models land in later phases.
  const disasterType: DisasterType = DISASTER_TYPES.includes(typeParam as DisasterType)
    ? (typeParam as DisasterType)
    : "flood";

  const elevation = elevationParam ? Number(elevationParam) : DEFAULT_ELEVATION_M;
  const rainfallMm = Number.isFinite(rainfall) ? rainfall : 0;

  // Optional soil saturation override (0-100 %). Converted to 0-1.
  const saturation = saturationParam ? Number(saturationParam) : NaN;
  const options = Number.isFinite(saturation)
    ? { soilSaturation: Math.min(1, Math.max(0, saturation / 100)) }
    : undefined;

  try {
    const prediction = await getFloodPrediction(lat, lng, rainfallMm, elevation, options);
    return NextResponse.json({ ok: true, disasterType, ...prediction });
  } catch (error) {
    console.error("ML prediction failed:", error);
    return NextResponse.json({ error: "Failed to run ML prediction." }, { status: 500 });
  }
}
