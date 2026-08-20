import { NextRequest, NextResponse } from "next/server";
import { getSafeWeatherData } from "@/lib/data-ingestion/fetcher";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

const FLOOD_PRONE_DISTRICTS = [
  { name: "Patna", lat: 25.5941, lng: 85.1376 },
  { name: "Kochi", lat: 9.9816, lng: 76.2999 },
  { name: "Guwahati", lat: 26.3161, lng: 91.5984 },
];

type IngestResult = {
  district: string;
  source?: string;
  rainfall_mm?: number;
  ok: boolean;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Bearer-token guard for Vercel Cron. Fails CLOSED: if CRON_SECRET is not
  // configured (unset or still a placeholder), reject the request rather than
  // silently allowing unauthenticated data ingestion.
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.startsWith("<")) {
    return NextResponse.json(
      { error: "Service not configured." },
      { status: 503 },
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: IngestResult[] = [];

  for (const district of FLOOD_PRONE_DISTRICTS) {
    try {
      const data = await getSafeWeatherData(district.lat, district.lng);

      await prisma.weatherData.create({
        data: {
          timestamp: new Date(),
          rainfallMm: data.rainfall_mm,
          riverLevelM: data.river_level_m,
          riverName: data.river_name,
          district: data.district,
          lat: data.lat,
          lng: data.lng,
        },
      });

      results.push({
        district: data.district ?? district.name,
        source: data.source,
        rainfall_mm: data.rainfall_mm,
        ok: true,
      });
    } catch (error: unknown) {
      console.error(`Ingest failed for ${district.name}:`, error);
      results.push({ district: district.name, ok: false });
    }
  }

  return NextResponse.json({
    ok: true,
    ingested: results.filter((r) => r.ok).length,
    results,
  });
}
