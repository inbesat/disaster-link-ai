import { NextRequest, NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/security/sanitize";
import { requireRole } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";

export const runtime = "nodejs";

/**
 * POST /api/field/handover
 * Mock end-of-shift handover report (Phase 14 · Step 10). Echoes the
 * report back for confirmation; a real build would persist to
 * `shift_handovers` and notify the incoming team + command center.
 *
 * Body: { responder, tasksCompleted, resourcesDispatched, notes, at }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: {
    responder?: unknown;
    tasksCompleted?: unknown;
    resourcesDispatched?: unknown;
    notes?: unknown;
    at?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    ack: "handover-logged",
    report: {
      responder: sanitizeInput(typeof body.responder === "string" ? body.responder : "unknown"),
      tasksCompleted:
        typeof body.tasksCompleted === "number" ? body.tasksCompleted : 0,
      resourcesDispatched:
        typeof body.resourcesDispatched === "number" ? body.resourcesDispatched : 0,
      notes: sanitizeInput(typeof body.notes === "string" ? body.notes : ""),
      at: typeof body.at === "string" ? body.at : new Date().toISOString(),
    },
  });
}
