import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { serializeBroadcastLog } from "@/lib/broadcast/fm-dispatcher";
import { aggregateBroadcastReport, type ReportAlertDTO } from "@/lib/broadcast/report";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/**
 * GET /api/broadcast/fm/report
 * DDMA/MIB compliance report over a date window.
 * Query: startDate (ISO), endDate (ISO), district (optional).
 * Returns aggregated stats: total alerts, stations reached, success rate %,
 * avg detection→broadcast minutes, language breakdown.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const district = searchParams.get("district")?.trim() || undefined;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 3600_000);
  const end = endDate ? new Date(endDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return NextResponse.json(
      { ok: false, error: "Invalid date range — use ISO startDate/endDate." },
      { status: 400 },
    );
  }

  try {
    const [alerts, logs] = await Promise.all([
      prisma.capAlert.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          ...(district
            ? { disasterEvent: { is: { district: { contains: district } } } }
            : {}),
        },
        include: { disasterEvent: { select: { district: true, type: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.fmBroadcastLog.findMany({
        where: { createdAt: { gte: start, lte: end }, testMode: false },
        include: { fmStation: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const alertRows: ReportAlertDTO[] = alerts.map((a) => ({
      id: a.id,
      alertId: a.alertId,
      createdAt: a.createdAt.toISOString(),
      language: a.language,
      severity: a.severity,
      district: a.disasterEvent?.district ?? null,
      disasterType: a.disasterEvent?.type ?? null,
    }));

    const report = aggregateBroadcastReport(
      alertRows,
      logs.map((row) => serializeBroadcastLog(row)),
    );

    return NextResponse.json({ ok: true, window: { start: start.toISOString(), end: end.toISOString() }, district: district ?? null, ...report });
  } catch (error) {
    console.error("Failed to build FM broadcast report:", error);
    return NextResponse.json({ ok: false, error: "Report generation failed." }, { status: 500 });
  }
}
