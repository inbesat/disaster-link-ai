import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import {
  runTestBroadcast,
  TEST_BROADCAST_CONFIRMATION,
  TEST_BROADCAST_MESSAGE,
} from "@/lib/fm/simulation";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin"] as const;

const testLimiter = createRateLimiter(5, 60_000);

/**
 * POST /api/broadcast/fm/test
 * Phase 9 · Safeguarded test broadcast.
 *
 * Guards:
 *   • government role required,
 *   • the request body MUST contain confirmation === "BROADCAST TEST"
 *     (typed by an admin — never sent from a plain button),
 *   • 5 attempts per minute per IP,
 *   • targets ONLY TEST_FM_STATIONS (fake webhook.site endpoints) and
 *     runs the deterministic dry-run from lib/fm/simulation — no
 *     outbound calls, no real stations, no TTS credits.
 *
 * Results are logged to fm_broadcast_logs with test_mode=true when the
 * DB is reachable; otherwise the dry-run response still returns.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = testLimiter(`fm-test:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded — 5 test broadcasts per minute." },
      { status: 429 },
    );
  }

  let confirmation = "";
  try {
    const body = (await request.json()) as { confirmation?: unknown };
    confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
  } catch {
    // fall through — empty confirmation fails the check below.
  }

  if (confirmation !== TEST_BROADCAST_CONFIRMATION) {
    return NextResponse.json(
      { ok: false, error: `Type "${TEST_BROADCAST_CONFIRMATION}" to confirm.` },
      { status: 400 },
    );
  }

  const results = runTestBroadcast();
  const dispatched = results.filter((r) => r.status === "delivered").length;

  // Best-effort audit trail (test_mode=true). DB unreachable is fine —
  // the dry-run result is the source of truth for the UI.
  try {
    const deliveredCap = results.filter((r) => r.strategy === "cap_api");
    await prisma.$transaction(
      deliveredCap.map((r) =>
        prisma.fmBroadcastLog.create({
          data: {
            fmStationId: r.stationId,
            strategy: r.strategy,
            status: r.status,
            responseCode: r.responseCode,
            responseBody: r.responseBody,
            retryCount: 0,
            testMode: true,
            externalRef: `TEST-${Date.now().toString(36)}-${r.stationId.slice(-4)}`,
          },
        }),
      ),
    );
  } catch (error: unknown) {
    console.warn("[fm-test] DB log skipped (unreachable?) — dry-run only.", error);
  }

  return NextResponse.json({
    ok: true,
    test: true,
    message: TEST_BROADCAST_MESSAGE,
    dispatched,
    failed: 0,
    stations: results,
  });
}
