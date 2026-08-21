import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { warnDbUnavailableOnce } from "@/lib/server/db-fallback";

export const dynamic = "force-dynamic";

// UI risk labels -> 0-3 index used as the chart's Y axis.
const RISK_INDEX: Record<string, number> = {
  Safe: 0,
  Watch: 1,
  Warning: 2,
  Evacuate: 3,
};

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Plausible mock risk-index curve for the fallback: ramps from Safe/Watch
// toward Warning over the window — mirrors a real rising river. Works for
// any `days` window and stays within the chart's [0, 3] domain.
function buildMockPoints(days: number) {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const progress = days <= 1 ? 0 : i / (days - 1);
    return {
      day: DAY_ORDER[date.getDay()],
      riskIndex: Number((0.4 + progress * 2.0).toFixed(2)),
      predictions: 4,
    };
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const daysParam = Number(request.nextUrl.searchParams.get("days"));
  const days = Math.min(14, Math.max(1, Number.isFinite(daysParam) ? daysParam : 7));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const rows = await prisma.floodPrediction.findMany({
      where: { predictionTimestamp: { gte: since } },
      orderBy: { predictionTimestamp: "asc" },
      select: { riskLevel: true, predictionTimestamp: true },
    });

    // No real predictions yet — serve realistic mock points so the chart
    // still renders.
    if (rows.length === 0) {
      return NextResponse.json({ source: "mock", points: buildMockPoints(days) });
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
  } catch (error: unknown) {
    // Prisma can be unreachable on cold starts (e.g. Vercel). Never 500 —
    // serve realistic mock points so the Recharts graph still renders.
    warnDbUnavailableOnce("predictions/history", error);
    return NextResponse.json({ source: "mock", points: buildMockPoints(days) });
  }
}
