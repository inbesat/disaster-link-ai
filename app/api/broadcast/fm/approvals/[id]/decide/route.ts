import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { approveApproval, rejectApproval } from "@/lib/broadcast/auto-trigger";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin"] as const;

const decideLimiter = createRateLimiter(10, 60_000);

/**
 * POST /api/broadcast/fm/approvals/[id]/decide
 * Decide a pending broadcast approval.
 * Body: { action: "approve" | "reject", message?: string }
 *   - approve → generates the CAP alert (with `message` when edited) and
 *     dispatches to covering stations, then marks the request approved.
 *   - reject  → records the rejection, nothing is broadcast.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const limit = decideLimiter(`fm-decide:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded — 10 decisions per minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const action = body.action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { ok: false, error: "action must be 'approve' or 'reject'." },
      { status: 400 },
    );
  }
  const message = typeof body.message === "string" ? body.message.trim() : undefined;

  try {
    if (action === "approve") {
      const result = await approveApproval(params.id, { message });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
      }
      return NextResponse.json({
        ok: true,
        action,
        approvalId: params.id,
        capAlertId: result.capAlertId,
      });
    }

    const result = await rejectApproval(params.id);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 422 });
    }
    return NextResponse.json({ ok: true, action, approvalId: params.id });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    console.error("FM approval decision failed:", messageText);
    return NextResponse.json(
      { ok: false, error: "Approval decision failed — check TTS provider keys." },
      { status: 503 },
    );
  }
}
