import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/require-role";
import {
  getActiveSessions,
  registerSession,
  revokeAllSessions,
} from "@/lib/security/session-manager";
import { clientIpFromRequest } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const userId = auth.role; // Using resolved user identity or session role
  const ip = clientIpFromRequest(request);
  const userAgent = request.headers.get("user-agent") ?? "Unknown Browser";

  // Ensure current session is registered
  let sessions = getActiveSessions(userId);
  if (sessions.length === 0) {
    registerSession(userId, auth.role, ip, userAgent, "Patna, Bihar");
    sessions = getActiveSessions(userId);
  }

  return NextResponse.json({ ok: true, sessions });
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const userId = auth.role;
  const keepCurrent = request.nextUrl.searchParams.get("keepCurrent") === "true";
  const currentSessionId = request.nextUrl.searchParams.get("currentSessionId") ?? undefined;

  revokeAllSessions(userId, keepCurrent ? currentSessionId : undefined);

  return NextResponse.json({
    ok: true,
    message: keepCurrent
      ? "Logged out all other devices."
      : "Logged out all sessions across all devices.",
  });
}
