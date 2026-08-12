import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { callStationControlRoom } from "@/lib/broadcast/fm-ivr-fallback";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin"] as const;

const ivrLimiter = createRateLimiter(10, 60_000);

/** Pull the headline text out of the CAP XML (for the spoken fallback). */
function capHeadline(capXml: string): string {
  const match = capXml.match(/<headline>([\s\S]*?)<\/headline>/);
  return match ? match[1] : "Emergency broadcast request from SafeSphere.";
}

/**
 * POST /api/broadcast/fm/ivr-fallback
 * Manually place the IVR control-room call for a station + CAP alert
 * ("Force IVR Call" from the Broadcast Monitor).
 * Body: { stationId: string, capAlertId: string }
 * Logs the attempt to fm_broadcast_logs (strategy=ivr, external_ref =
 * Twilio CallSid); the call-status webhook later moves it to delivered /
 * failed.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const limit = ivrLimiter(`ivr:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded — 10 IVR calls per minute." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)),
        },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const stationId = typeof body.stationId === "string" ? body.stationId.trim() : "";
  const capAlertId = typeof body.capAlertId === "string" ? body.capAlertId.trim() : "";
  if (!stationId || !capAlertId) {
    return NextResponse.json(
      { ok: false, error: "stationId and capAlertId are required." },
      { status: 400 },
    );
  }

  try {
    const [station, capAlert] = await Promise.all([
      prisma.fmStation.findUnique({ where: { id: stationId } }),
      prisma.capAlert.findUnique({ where: { id: capAlertId } }),
    ]);

    if (!station) {
      return NextResponse.json(
        { ok: false, error: "Station not found." },
        { status: 404 },
      );
    }
    if (!capAlert) {
      return NextResponse.json(
        { ok: false, error: "CAP alert not found." },
        { status: 404 },
      );
    }
    if (!station.emergencyContactPhone) {
      return NextResponse.json(
        {
          ok: false,
          error: `${station.name} has no emergency contact phone — add one in FM Stations first.`,
        },
        { status: 422 },
      );
    }

    const result = await callStationControlRoom(
      station.emergencyContactPhone,
      capAlert.audioUrl,
      capHeadline(capAlert.capXml),
      { state: station.state },
    );

    // Log the attempt — the call-status webhook matches on external_ref.
    await prisma.fmBroadcastLog
      .create({
        data: {
          capAlertId: capAlert.id,
          fmStationId: station.id,
          strategy: "ivr",
          status: result.ok ? "sent" : "failed",
          responseCode: result.responseCode,
          responseBody: result.responseBody.slice(0, 2000),
          broadcastTime: result.ok ? new Date() : null,
          retryCount: 0,
          externalRef: result.callSid,
        },
      })
      .catch((error) => {
        console.error("[ivr-fallback] Failed to write fm_broadcast_log:", error);
      });

    return NextResponse.json({
      ok: result.ok,
      stationId: station.id,
      capAlertId: capAlert.id,
      callSid: result.callSid,
      status: result.ok ? "sent" : "failed",
      responseCode: result.responseCode,
      error: result.error ?? undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("IVR fallback failed:", message);
    return NextResponse.json(
      { ok: false, error: "IVR call failed — check Twilio credentials." },
      { status: 503 },
    );
  }
}
