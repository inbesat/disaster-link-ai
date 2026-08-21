import { NextResponse } from "next/server";
import { sanitizeInput } from "@/lib/security/sanitize";
import { requireRole } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";

export const runtime = "nodejs";

// Simulated dispatch to the District Control Room. In the demo this echoes the
// critical alert back so the SOS banner can confirm broadcast; a real build
// would fan this out over WebSocket/SMS to nearby units.
export async function POST(req: Request): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as {
      type?: string;
      responder?: string;
      lat?: number;
      lng?: number;
      at?: string;
    };
    const ok = body.type === "SOS_EMERGENCY";
    return NextResponse.json(
      {
        ok,
        ack: body.type === "SOS_EMERGENCY" ? "control-room-ack" : "rejected",
        payload: {
          ...body,
          responder: typeof body.responder === "string" ? sanitizeInput(body.responder) : undefined,
        },
        notifiedUnits: 4,
      },
      { status: ok ? 200 : 422 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
}