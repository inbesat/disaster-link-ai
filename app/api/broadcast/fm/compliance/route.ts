import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { serializeBroadcastLog } from "@/lib/broadcast/fm-dispatcher";
import { computeStationCompliance } from "@/lib/broadcast/compliance";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/**
 * GET /api/broadcast/fm/compliance
 * Station Compliance Scores — worst performers first (DDMA follow-up).
 * Query: days (default 30) — the scoring window of broadcast logs.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 3600_000);

  try {
    const [stations, logs] = await Promise.all([
      prisma.fmStation.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.fmBroadcastLog.findMany({
        where: { createdAt: { gte: since }, testMode: false },
        include: { fmStation: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const scores = computeStationCompliance(
      stations.map((s) => ({ id: s.id, name: s.name })),
      logs.map((row) => serializeBroadcastLog(row)),
    );

    return NextResponse.json({
      ok: true,
      days,
      flagged: scores.filter((s) => s.needsFollowUp).length,
      stations: scores,
    });
  } catch (error: unknown) {
    console.error("Failed to compute station compliance:", error);
    return NextResponse.json(
      { ok: false, error: "Compliance scoring failed." },
      { status: 500 },
    );
  }
}
