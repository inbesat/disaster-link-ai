import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

// UI risk labels -> 0-3 index used as the chart's Y axis.
const RISK_INDEX: Record<string, number> = {
  Safe: 0,
  Watch: 1,
  Warning: 2,
  Evacuate: 3,
};

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET(request: NextRequest) {
  const daysParam = Number(request.nextUrl.searchParams.get("days"));
  const days = Math.min(14, Math.max(1, Number.isFinite(daysParam) ? daysParam : 7));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const rows = await prisma.floodPrediction.findMany({
      where: { predictionTimestamp: { gte: since } },
      orderBy: { predictionTimestamp: "asc" },
      select: { riskLevel: true, predictionTimestamp: true },
    });

    // No real predictions yet — tell the chart to fall back to demo data.
    if (rows.length === 0) {
      return NextResponse.json({ source: "mock", points: [] });
    }

    // Bucket predictions by weekday and average the risk index per day.
    const buckets = new Map<string, { total: number; count: number }>();
    for (const row of rows) {
      const day = DAY_ORDER[new Date(row.predictionTimestamp).getDay()];
      const index = RISK_INDEX[row.riskLevel] ?? 0;
      const current = buckets.get(day) ?? { total: 0, count: 0 };
      current.total += index;
      current.count += 1;
      buckets.set(day, current);
    }

    const points = Array.from(buckets.entries())
      .sort((a, b) => DAY_ORDER.indexOf(a[0]) - DAY_ORDER.indexOf(b[0]))
      .map(([day, bucket]) => ({
        day,
        riskIndex: Number((bucket.total / bucket.count).toFixed(2)),
        predictions: bucket.count,
      }));

    return NextResponse.json({ source: "real", points, total: rows.length });
  } catch (error) {
    console.error("Failed to load prediction history:", error);
    return NextResponse.json({ source: "mock", points: [] });
  }
}
