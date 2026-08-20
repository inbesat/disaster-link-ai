import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { generateAlertAudio } from "@/lib/tts/alert-voice-generator";
import { isTtsLanguage } from "@/lib/tts/types";
import { alertAudioCacheKey, storeAlertAudio } from "@/lib/tts/audio-store";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

const VALID_SEVERITIES = ["watch", "warning", "critical"] as const;
const VALID_DISASTER_TYPES = ["flood", "cyclone", "earthquake", "heatwave"] as const;

/** TTS hits a paid vendor API — keep the budget tight per operator. */
const ttsLimiter = createRateLimiter(30, 60_000);

/**
 * POST /api/tts/generate
 * Generate radio-ready emergency audio (MP3 voice + 1000 Hz beep) for an
 * alert. The caller supplies an alert request; the server builds the
 * broadcast script, synthesizes it via the provider chain, stores the
 * audio in the `alert-audio` bucket (24 h cache by content hash), and
 * returns URLs plus the exact spoken script.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Per-operator rate limit (idempotent requests still count — each run
  // costs a vendor TTS credit).
  // Per-caller rate limit (idempotent requests still count — each run
  // costs a vendor TTS credit). Keyed on client IP when available.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const limitKey = `tts:${ip}`;
  const limit = ttsLimiter(limitKey);
  if (!limit.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded — 30 TTS generations per minute.",
      },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetTime - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const language = body.language;
  if (typeof language !== "string" || !isTtsLanguage(language)) {
    return NextResponse.json(
      { ok: false, error: "language must be one of: hi, en, bn, ta, te, mr, ml." },
      { status: 400 },
    );
  }
  const severity = body.severity;
  if (typeof severity !== "string" || !(VALID_SEVERITIES as readonly string[]).includes(severity)) {
    return NextResponse.json(
      { ok: false, error: "severity must be one of: watch, warning, critical." },
      { status: 400 },
    );
  }
  const disasterType = body.disasterType;
  if (
    typeof disasterType !== "string" ||
    !(VALID_DISASTER_TYPES as readonly string[]).includes(disasterType)
  ) {
    return NextResponse.json(
      { ok: false, error: "disasterType must be one of: flood, cyclone, earthquake, heatwave." },
      { status: 400 },
    );
  }
  const validSeverity = severity as (typeof VALID_SEVERITIES)[number];
  const validDisasterType = disasterType as (typeof VALID_DISASTER_TYPES)[number];  const district = typeof body.district === "string" ? body.district.trim() : "";
  if (!district) {
    return NextResponse.json(
      { ok: false, error: "district is required." },
      { status: 400 },
    );
  }
  const message = typeof body.message === "string" ? body.message.trim() : undefined;
  const templateVars =
    body.templateVars && typeof body.templateVars === "object"
      ? (body.templateVars as Record<string, string>)
      : undefined;

  try {
    const generated = await generateAlertAudio({
      message,
      language,
      severity: validSeverity,
      district,
      disasterType: validDisasterType,
      templateVars,
    });

    const cacheKey = alertAudioCacheKey({
      script: generated.script,
      language,
    });
    const stored = await storeAlertAudio({
      cacheKey,
      voice: generated.voice.buffer,
      beep: generated.beep.buffer,
    });

    // Persist an audio generation record for the dispatch pipeline /
    // analytics (Phase 3 ties it to FM dispatches via alertId).
    const record = await prisma.alertAudio
      .create({
        data: {
          alertId: null,
          language,
          provider: generated.voice.provider,
          durationSec: generated.voice.durationSec,
          script: generated.script,
          cacheKey,
          audioUrl: stored.audioUrl,
        },
      })
      .catch(() => null);

    return NextResponse.json({
      ok: true,
      audioUrl: stored.audioUrl,
      beepUrl: stored.beepUrl,
      audioDataUri: stored.audioDataUri,
      beepDataUri: stored.beepDataUri,
      durationSec: generated.voice.durationSec,
      provider: generated.voice.provider,
      script: generated.script,
      cacheKey,
      cached: stored.cached,
      recordId: record?.id ?? null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("TTS generation failed:", message);
    return NextResponse.json(
      { ok: false, error: "TTS generation failed — check provider keys and try again." },
      { status: 503 },
    );
  }
}
