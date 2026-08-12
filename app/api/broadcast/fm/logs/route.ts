import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { serializeBroadcastLog } from "@/lib/broadcast/fm-dispatcher";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/**
 * GET /api/broadcast/fm/logs
 * Recent fm_broadcast_logs rows (with station names), newest first.
 * Query: limit (default 50, max 200), stationId (optional filter).
 * Powers the FM Broadcast Monitor widget.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get("limit")) || 50;
  const limit = Math.min(Math.max(rawLimit, 1), 200);
  const stationId = searchParams.get("stationId")?.trim() || undefined;

  try {
    const logs = await prisma.fmBroadcastLog.findMany({
      where: stationId ? { fmStationId: stationId } : undefined,
      include: { fmStation: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      ok: true,
      logs: logs.map((row) => serializeBroadcastLog(row)),
    });
  } catch (error) {
    console.error("Failed to list FM broadcast logs:", error);
    return NextResponse.json({ ok: true, logs: [] });
  }
}
