import { NextRequest, NextResponse } from "next/server";
import { getFloodPrediction } from "@/lib/ml-client";
import { DISASTER_TYPES, type DisasterType } from "@/lib/disasters/disaster-types";
import { createRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

// Rate limit: 20 predictions per minute per IP
const predictLimiter = createRateLimiter(20, 60_000);

// Floodplains typically sit ~25-40m ASL; used when the caller has no elevation.
const DEFAULT_ELEVATION_M = 30;

export async function GET(request: NextRequest) {
  // Rate limit check
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  const rateResult = predictLimiter(`predict:${ip}`);
  if (!rateResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)) } },
    );
  }

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
