import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  createMissingReport,
  listMissingReports,
  updateMissingReportStatus,
} from "@/lib/reports/missing-store";

export const dynamic = "force-dynamic";

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

// ---------------------------------------------------------------------
// /api/reports/missing — Missing Person & Casualty reporting workflow.
//
// Backed by lib/reports/missing-store.ts (in-memory, seeded) so the full
// citizen → command-center loop demos with zero database dependency.
//
//   GET    ?status=&type=   → filtered list (public read)
//   POST                    → citizen report, forced PENDING_REVIEW
//   PATCH   {id,status}     → gov officials verify/resolve/reject
// ---------------------------------------------------------------------

export async function GET(request: NextRequest): Promise<NextResponse> {
  const status = request.nextUrl.searchParams.get("status");
  const type = request.nextUrl.searchParams.get("type");
  return NextResponse.json({
    ok: true,
    source: "memory",
    reports: listMissingReports({ status, type }),
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Citizens and demo guests file reports openly — spam is bounded by an
  // IP rate limit + server-side field caps rather than auth walls.
  const budget = rateLimit(`reports-missing:post:${clientIp(request)}`, 10, 60_000);
  if (!budget.success) {
    return NextResponse.json(
      { ok: false, error: "Too many reports filed. Please wait a minute." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const [report, error] = createMissingReport(body);
  if (!report) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  return NextResponse.json(
    { ok: true, report, message: "Report submitted to Emergency Command Center. Field verification in progress." },
    { status: 201 },
  );
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  // Status transitions are government actions only.
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  if (!id || !status) {
    return NextResponse.json(
      { ok: false, error: "id and status are required." },
      { status: 400 },
    );
  }

  const updated = updateMissingReportStatus(id, status);
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "Report not found or invalid status." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, report: updated });
}
