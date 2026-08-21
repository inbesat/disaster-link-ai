import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import {
  buildEmergencyRdsText,
  sendRDSText,
  type RdsSeverity,
} from "@/lib/broadcast/rds-encoder";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin"] as const;

const rdsLimiter = createRateLimiter(20, 60_000);

const VALID_SEVERITIES: RdsSeverity[] = ["critical", "warning", "watch"];

/**
 * POST /api/broadcast/rds/push
 * Push scrolling RDS text to an RDS-enabled station's encoder.
 * Body: { stationId, message?, severity?, disasterType?, district?,
 *        duration? }
 *   - `message` (custom text) is preferred and smart-truncated to 64 chars;
 *   - otherwise `severity` + `disasterType` + `district` build a template
 *     line (EVACUATE NOW: … / WARNING: … / WATCH: …).
 * Returns: { success, rdsEncoderResponse } and logs the attempt (with the
 * encoder's confirmation) to fm_broadcast_logs.
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
  const limit = rdsLimiter(`rds:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded — 20 RDS pushes per minute." },
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
  if (!stationId) {
    return NextResponse.json(
      { ok: false, error: "stationId is required." },
      { status: 400 },
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const district = typeof body.district === "string" ? body.district.trim() : "";
  const severity = body.severity;
  const disasterType =
    typeof body.disasterType === "string" ? body.disasterType.trim() : "";

  if (!message && !(disasterType && district)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Provide `message`, or `disasterType` + `district` (+ optional `severity`) to build the RDS line.",
      },
      { status: 400 },
    );
  }
  const severityTier: RdsSeverity | undefined =
    typeof severity === "string" && (VALID_SEVERITIES as string[]).includes(severity)
      ? (severity as RdsSeverity)
      : undefined;
  if (typeof severity === "string" && !severityTier) {
    return NextResponse.json(
      { ok: false, error: "severity must be one of: critical, warning, watch." },
      { status: 400 },
    );
  }

  const duration = Number(body.duration) || 30;
  const clampedDuration = Math.min(Math.max(duration, 5), 1440); // 5 min – 24 h

  try {
    const station = await prisma.fmStation.findUnique({ where: { id: stationId } });
    if (!station) {
      return NextResponse.json(
        { ok: false, error: "Station not found." },
        { status: 404 },
      );
    }
    if (!station.rdsEnabled || !station.rdsApiEndpoint) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `${station.name} is not RDS-enabled or has no rds_api_endpoint — ` +
            "add one in FM Stations first.",
        },
        { status: 422 },
      );
    }

    const text =
      message ||
      buildEmergencyRdsText({
        severity: severityTier,
        disasterType,
        district,
      });

    const result = await sendRDSText(station, text, clampedDuration, {
      stationId: station.id,
    });

    // Audit trail — the confirmation flag rides in the response body.
    await prisma.fmBroadcastLog
      .create({
        data: {
          fmStationId: station.id,
          strategy: "rds",
          status: result.ok ? "delivered" : "failed",
          responseCode: result.responseCode,
          responseBody:
            `${result.responseBody}${result.confirmed ? " (confirmed=live)" : ""}`.slice(
              0,
              2000,
            ),
          broadcastTime: result.ok ? new Date() : null,
          retryCount: 0,
        },
      })
      .catch((error) => {
        console.error("[rds/push] Failed to write fm_broadcast_log:", error);
      });

    return NextResponse.json({
      success: result.ok,
      confirmed: result.confirmed,
      rdsEncoderResponse: {
        ok: result.ok,
        confirmed: result.confirmed,
        responseCode: result.responseCode,
        responseBody: result.responseBody,
      },
      text,
      stationId: station.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("RDS push failed:", message);
    return NextResponse.json({ ok: false, error: "RDS push failed." }, { status: 503 });
  }
}
