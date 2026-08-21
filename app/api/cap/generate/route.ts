import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { generateCapForEvent } from "@/lib/cap/cap-service";
import { isTtsLanguage } from "@/lib/tts/types";
import type { CapSeverity, CapUrgency } from "@/lib/cap/types";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

const capLimiter = createRateLimiter(15, 60_000);

/** Parse a body polygon into lon,lat pairs (validated by cap-validator). */
function parsePolygon(value: unknown): Array<[number, number]> | undefined {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const pairs: Array<[number, number]> = [];
  for (const item of value) {
    if (!Array.isArray(item) || item.length < 2) return undefined;
    const lon = Number(item[0]);
    const lat = Number(item[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return undefined;
    pairs.push([lon, lat]);
  }
  return pairs;
}

/** Parse a body circle into [lon, lat, radiusKm]. */
function parseCircle(value: unknown): [number, number, number] | undefined {
  if (!Array.isArray(value) || value.length < 3) return undefined;
  const lon = Number(value[0]);
  const lat = Number(value[1]);
  const radius = Number(value[2]);
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || !Number.isFinite(radius)) {
    return undefined;
  }
  return [lon, lat, radius];
}

/**
 * POST /api/cap/generate
 * Generate a CAP v1.2 alert for a disaster event.
 * Body: { eventId, language?, severity?, urgency?, message?, polygon?, circle? }
 * Fetches the event + shelters, voices the alert (TTS), builds the CAP XML
 * with an audio <resource> link, validates it, and stores it in cap_alerts.
 * Returns: { capXml, alertId, audioUrl, recordId, ... }
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
  const limit = capLimiter(`cap:${ip}`);
  if (!limit.success) {
    return NextResponse.json(
      { ok: false, error: "Rate limit exceeded — 15 CAP generations per minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  if (!eventId) {
    return NextResponse.json(
      { ok: false, error: "eventId is required." },
      { status: 400 },
    );
  }

  const language = body.language;
  if (typeof language === "string" && !isTtsLanguage(language)) {
    return NextResponse.json(
      { ok: false, error: "language must be one of: hi, en, bn, ta, te, mr, ml." },
      { status: 400 },
    );
  }

  const severity = body.severity;
  const urgency = body.urgency;
  const message = typeof body.message === "string" ? body.message : undefined;

  try {
    const result = await generateCapForEvent(eventId, {
      language: typeof language === "string" ? language : undefined,
      severity: isCapSeverity(severity) ? severity : undefined,
      urgency: isCapUrgency(urgency) ? urgency : undefined,
      message,
      polygon: parsePolygon(body.polygon),
      circle: parseCircle(body.circle),
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("not found")) {
      return NextResponse.json({ ok: false, error: message }, { status: 404 });
    }
    if (message.includes("validation failed")) {
      return NextResponse.json({ ok: false, error: message }, { status: 422 });
    }
    console.error("CAP generation failed:", message);
    return NextResponse.json(
      { ok: false, error: "CAP generation failed — check TTS provider keys." },
      { status: 503 },
    );
  }
}

function isCapSeverity(value: unknown): value is CapSeverity {
  return (
    typeof value === "string" &&
    ["Extreme", "Severe", "Moderate", "Minor", "Unknown"].includes(value)
  );
}

function isCapUrgency(value: unknown): value is CapUrgency {
  return (
    typeof value === "string" &&
    ["Immediate", "Expected", "Future", "Past", "Unknown"].includes(value)
  );
}
