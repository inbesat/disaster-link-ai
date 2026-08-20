import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { loadBroadcastHistoryRows } from "@/lib/broadcast/history";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/**
 * GET /api/broadcast/fm/history
 * Filterable broadcast history for the admin table.
 * Query: startDate, endDate, district, disasterType, status (all optional).
 * Returns one row per CAP alert with per-station delivery detail (the
 * station-wise broadcast certificate content) for the expandable rows.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")?.trim();
  const endDate = searchParams.get("endDate")?.trim();
  const district = searchParams.get("district")?.trim() || undefined;
  const disasterType = searchParams.get("disasterType")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 3600_000);
  const end = endDate ? new Date(endDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return NextResponse.json(
      { ok: false, error: "Invalid date range — use ISO startDate/endDate." },
      { status: 400 },
    );
  }

  try {
    const rows = await loadBroadcastHistoryRows({
      start,
      end,
      district: district ?? undefined,
      disasterType: disasterType ?? undefined,
      status: status ?? undefined,
    });

    return NextResponse.json({ ok: true, count: rows.length, alerts: rows });
  } catch (error: unknown) {
    console.error("Failed to load FM broadcast history:", error);
    return NextResponse.json({ ok: false, error: "History load failed." }, { status: 500 });
  }
}
