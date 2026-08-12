import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { renderBroadcastReportHtml } from "@/lib/broadcast/report-html";
import {
  demoHistoryRows,
  loadBroadcastHistoryRows,
} from "@/lib/broadcast/history";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

/**
 * GET /api/broadcast/fm/export/pdf
 * Phase 8 · PDF/print export for DDMA/MIB reporting.
 * Accepts the same filters as /api/broadcast/fm/history (startDate,
 * endDate, district, disasterType, status) and returns a print-ready,
 * A4-optimised HTML document — the browser's "Save as PDF" produces the
 * downloadable compliance report (station-wise certificates + summary).
 *
 * When the database is unreachable (migrations not pushed / offline) the
 * route falls back to clearly-stamped DEMO rows so the export can still
 * be rehearsed end-to-end — same convention as /api/fm/stations.
 */
export async function GET(request: NextRequest) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate")?.trim() || null;
  const endDate = searchParams.get("endDate")?.trim() || null;
  const district = searchParams.get("district")?.trim() || null;
  const disasterType = searchParams.get("disasterType")?.trim() || null;
  const status = searchParams.get("status")?.trim() || null;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 3600_000);
  const end = endDate ? new Date(endDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return NextResponse.json(
      { ok: false, error: "Invalid date range — use ISO startDate/endDate." },
      { status: 400 },
    );
  }

  let source: "live" | "demo" = "live";
  let rows;
  try {
    rows = await loadBroadcastHistoryRows({
      start,
      end,
      district: district ?? undefined,
      disasterType: disasterType ?? undefined,
      status: status ?? undefined,
    });
  } catch (error) {
    // DB unreachable — serve clearly-stamped demo rows so the export can
    // still be rehearsed before migrations are pushed.
    console.error("[broadcast] PDF export DB load failed — using demo rows:", error);
    source = "demo";
    rows = demoHistoryRows();
  }

  const html = renderBroadcastReportHtml({
    rows,
    source,
    filters: { startDate, endDate, district, disasterType, status },
  });

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
