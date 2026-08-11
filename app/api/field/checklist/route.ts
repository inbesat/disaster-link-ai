import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * POST /api/field/checklist
 * Mock accountability log for the pre-deployment readiness checklist
 * (Phase 14 · Step 9). Persists nothing in the demo — echoes the
 * confirmation so the field app knows the log landed. A real build would
 * write to `responder_readiness_logs` for post-incident review.
 *
 * Body: { responder, shiftDate, items: string[], confirmed, at }
 */
export async function POST(request: NextRequest) {
  let body: {
    responder?: unknown;
    shiftDate?: unknown;
    items?: unknown;
    confirmed?: unknown;
    at?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray(body.items)
    ? (body.items as unknown[]).map(String)
    : [];

  if (body.confirmed !== true || items.length === 0) {
    return NextResponse.json(
      { ok: false, error: "confirmed=true and a non-empty items list are required." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    ack: "readiness-logged",
    log: {
      responder: typeof body.responder === "string" ? body.responder : "unknown",
      shiftDate: typeof body.shiftDate === "string" ? body.shiftDate : "unknown",
      items,
      confirmed: true,
      at: typeof body.at === "string" ? body.at : new Date().toISOString(),
    },
  });
}
