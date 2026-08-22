import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { safeLog } from "@/lib/logger";

/** Deterministic pseudo-random in [min, max) seeded by coordinates — keeps
    mock weather stable for the same spot across refreshes. */
function mockWeatherFor(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453);
  const temp = 24 + (seed % 1) * 10; // 24–34 °C, monsoon-season plausible
  const rainfall = seed % 1 < 0.35 ? Math.round((seed * 7) % 18 * 10) / 10 : 0;
  return {
    temperature_c: Math.round(temp * 10) / 10,
    rainfall_mm: rainfall,
    description: rainfall > 5 ? "moderate rain" : rainfall > 0 ? "light rain" : "scattered clouds",
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const latParam = request.nextUrl.searchParams.get("lat");
  const lngParam = request.nextUrl.searchParams.get("lng");
  const apiKey = process.env.OPENWEATHER_API_KEY;

  const lat = Number(latParam);
  const lng = Number(lngParam);

  if (!latParam || !lngParam || Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { error: "Missing or invalid 'lat' / 'lng' query parameters." },
      { status: 400 },
    );
  }

  // No key configured — serve deterministic mock weather so map widgets
  // keep rendering during demos (source: "mock").
  if (!apiKey) {
    safeLog("warn", "OPENWEATHER_API_KEY not configured — serving mock weather.");
    return NextResponse.json({
      ok: true,
      recorded: null,
      persisted: false,
      source: "mock",
      weather: mockWeatherFor(lat, lng),
    });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    const response = await fetch(url, { next: { revalidate: 60 } });

    // Invalid/expired key (401), quota exceeded (429), etc. — degrade to
    // mock weather instead of 500-ing every widget on the page.
    if (!response.ok) {
      safeLog("warn", `OpenWeatherMap responded ${response.status} — serving mock weather.`);
      return NextResponse.json({
        ok: true,
        recorded: null,
        persisted: false,
        source: "mock",
        weather: mockWeatherFor(lat, lng),
      });
    }

    const data = (await response.json()) as {
      id?: number;
      main?: { temp?: number };
      rain?: { "1h"?: number; "3h"?: number };
      weather?: { description?: string }[];
    };

    const rainfallMm = data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0;

    let recorded: {
      id: string;
      rainfallMm: number;
      district: string | null;
      lat: number;
      lng: number;
    } | null = null;
    try {
      const record = await prisma.weatherData.create({
        data: {
          stationId: data.id ? String(data.id) : null,
          timestamp: new Date(),
          rainfallMm,
          district: null,
          lat,
          lng,
        },
      });
      recorded = {
        id: record.id,
        rainfallMm: record.rainfallMm,
        district: record.district,
        lat: record.lat,
        lng: record.lng,
      };
    } catch (persistError: unknown) {
      safeLog("warn", "Failed to persist weather data (continuing)", { metadata: { error: String(persistError) } });
    }

    return NextResponse.json({
      ok: true,
      recorded,
      persisted: recorded !== null,
      source: "openweathermap",
      weather: {
        temperature_c: data.main?.temp ?? null,
        rainfall_mm: rainfallMm,
        description: data.weather?.[0]?.description ?? null,
      },
    });
  } catch (error: unknown) {
    // Network failure reaching OpenWeatherMap — degrade to mock weather
    // rather than surfacing a 500 to every widget on the page.
    safeLog("warn", `Weather fetch failed — serving mock weather (${String(error)})`);
    return NextResponse.json({
      ok: true,
      recorded: null,
      persisted: false,
      source: "mock",
      weather: mockWeatherFor(lat, lng),
    });
  }
}
