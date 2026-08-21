import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/security/require-role";
import { revokeSession } from "@/lib/security/session-manager";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const userId = auth.role;
  const sessionId = params.id;

  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "Session ID is required." }, { status: 400 });
  }

  const revoked = revokeSession(userId, sessionId);

  return NextResponse.json({
    ok: true,
    revoked,
    message: revoked ? "Session revoked successfully." : "Session not found.",
  });
}
