import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/sandbox/status
 * Reports whether this browser is in read-only sandbox mode (Phase 15 ·
 * Step 4). The `sandbox` cookie is httpOnly, so the client can't read it
 * directly — this endpoint is the sanctioned way for UI (banners, form
 * handlers) to learn "we're in the judges' sandbox".
 *
 * Response: { sandbox: boolean }
 */
export async function GET(request: NextRequest) {
  const isSandbox = request.cookies.get("sandbox")?.value === "true";
  return NextResponse.json({ sandbox: isSandbox });
}
