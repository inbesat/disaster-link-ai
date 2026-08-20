import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { dispatchToStations } from "@/lib/broadcast/fm-dispatcher";

export const dynamic = "force-dynamic";

// Broadcasts go out on the real network — only district admins + super
// admins may trigger one.
const BROADCAST_ROLES = ["super_admin", "district_admin"] as const;

const dispatchLimiter = createRateLimiter(5, 60_000);

/**
 * POST /api/broadcast/fm/dispatch
 * Dispatch a CAP alert for a disaster event to covering FM stations.
 * Body: { disasterEventId: string, testMode?: boolean }
 *
 * testMode: true → dry-run every station (no outbound calls), returns a
 * deterministic report so a safety check can be rehearsed end-to-end.
 *
 * Returns: { dispatched, failed, testMode, stations: [...] }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(BROADCAST_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const limit = dispatchLimiter(`broadcast:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded — 5 broadcasts per minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const disasterEventId = typeof body.disasterEventId === "string" ? body.disasterEventId.trim() : "";
  if (!disasterEventId) {
    return NextResponse.json(
      { ok: false, error: "disasterEventId is required." },
      { status: 400 },
    );
  }

  const testMode = body.testMode === true;

  try {
    const report = await dispatchToStations(disasterEventId, {
      testMode,
      // Keep the route responsive: retries with the real 2-minute backoff
      // are meant for the background job; live callers get one quick pass.
      maxAttempts: 1,
      retryDelayMs: 0,
    });

    return NextResponse.json({ ok: true, ...report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not found")) {
      return NextResponse.json({ ok: false, error: message }, { status: 404 });
    }
    if (message.includes("generate one via")) {
      return NextResponse.json({ ok: false, error: message }, { status: 422 });
    }
    console.error("FM dispatch failed:", message);
    return NextResponse.json(
      { ok: false, error: "Broadcast dispatch failed." },
      { status: 500 },
    );
  }
}
