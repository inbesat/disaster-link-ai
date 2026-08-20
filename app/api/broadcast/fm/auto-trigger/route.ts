import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { evaluateAutoTrigger } from "@/lib/broadcast/auto-trigger";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin"] as const;

const triggerLimiter = createRateLimiter(30, 60_000);

/**
 * POST /api/broadcast/fm/auto-trigger
 * Called by the prediction pipeline (or the admin demo) when a district's
 * risk escalates. Evaluates the alert_rules_fm rules for the district:
 *   - auto_broadcast + under the rate limit → generates the CAP alert and
 *     dispatches to covering FM stations immediately (mode: "auto");
 *   - otherwise → creates a pending approval request for the admin queue
 *     (mode: "manual_approval").
 * Body: { disasterEventId, riskLevel, district, disasterType? }
 * Returns: { triggered, mode, severity?, approvalId?, reason? }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const limit = triggerLimiter(`fm-trigger:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded — 30 trigger evaluations per minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const disasterEventId =
    typeof body.disasterEventId === "string" ? body.disasterEventId.trim() : "";
  const riskLevel = typeof body.riskLevel === "string" ? body.riskLevel.trim() : "";
  const district = typeof body.district === "string" ? body.district.trim() : "";

  if (!disasterEventId || !riskLevel || !district) {
    return NextResponse.json(
      { ok: false, error: "disasterEventId, riskLevel and district are required." },
      { status: 400 },
    );
  }

  try {
    const result = await evaluateAutoTrigger({
      disasterEventId,
      riskLevel,
      district,
      disasterType:
        typeof body.disasterType === "string" ? body.disasterType.trim() : undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("FM auto-trigger failed:", message);
    return NextResponse.json(
      { ok: false, error: "Auto-trigger evaluation failed." },
      { status: 500 },
    );
  }
}
