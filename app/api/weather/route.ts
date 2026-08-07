import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export async function GET(request: NextRequest) {
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

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    const response = await fetch(url, { next: { revalidate: 60 } });

    if (!response.ok) {
      throw new Error(`OpenWeatherMap responded with status ${response.status}`);
    }

    const data = (await response.json()) as {
      id?: number;
      main?: { temp?: number };
      rain?: { "1h"?: number; "3h"?: number };
      weather?: { description?: string }[];
    };

    const rainfallMm = data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0;

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

    return NextResponse.json({
      ok: true,
      recorded: {
        id: record.id,
        rainfall_mm: record.rainfallMm,
        district: record.district,
        lat: record.lat,
        lng: record.lng,
      },
      weather: {
        temperature_c: data.main?.temp ?? null,
        rainfall_mm: rainfallMm,
        description: data.weather?.[0]?.description ?? null,
      },
    });
  } catch (error) {
    console.error("Weather fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch or persist weather data." },
      { status: 500 },
    );
  }
}
