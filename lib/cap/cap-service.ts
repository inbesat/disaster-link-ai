// ---------------------------------------------------------------------
// lib/cap/cap-service.ts — Phase 3 · CAP generation orchestration.
//
// Bridges the CAP builder to the rest of the platform:
//   • fetches the triggering DisasterEvent + shelters from the DB,
//   • builds the broadcast script and voices it via the Phase 2 TTS
//     pipeline (lib/tts), storing the audio for a <resource> link,
//   • resolves the per-disaster preset (category/urgency/severity/…)
//     with district overrides,
//   • assembles + validates the CAP v1.2 XML,
//   • persists the message in `cap_alerts` for the audit trail.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";
import { generateAlertAudio } from "@/lib/tts/alert-voice-generator";
import { storeAlertAudio, alertAudioCacheKey } from "@/lib/tts/audio-store";
import { isTtsLanguage, type TtsLanguage } from "@/lib/tts/types";
import { buildCapAlert } from "./cap-builder";
import { districtHeadline, resolveCapPreset, type CapDisasterType } from "./cap-templates";
import { validateCapAlert } from "./cap-validator";
import { hashCapXml } from "./cap-hash";
import type { CapArea, CapSeverity, CapUrgency } from "./types";

/** BCP-47 language tag per TTS language code (hi → hi-IN). */
const BCP47: Record<TtsLanguage, string> = {
  hi: "hi-IN",
  en: "en-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  ml: "ml-IN",
};

/** A couple of well-known district centroids for area fallbacks. */
const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  patna: [85.14, 25.59],
  puri: [85.82, 19.8],
  bihar: [85.31, 25.1],
  odisha: [84.35, 20.4],
  bhagalpur: [86.98, 25.24],
  muzaffarpur: [85.39, 26.12],
  munger: [86.47, 25.38],
  darbhanga: [85.9, 26.15],
  chennai: [80.27, 13.08],
  bengaluru: [77.59, 12.97],
  mumbai: [72.88, 19.08],
  kolkata: [88.36, 22.57],
};

export interface GenerateCapOptions {
  /** TTS language for the voiced audio + CAP <info> language. */
  language?: string;
  /** Explicit severity override (defaults to the disaster preset). */
  severity?: CapSeverity;
  /** Explicit urgency override. */
  urgency?: CapUrgency;
  /** Custom core message (overrides the disaster template). */
  message?: string;
  /** Affected-area polygon as lon,lat pairs (defaults to district circle). */
  polygon?: Array<[number, number]>;
  /** Affected-area circle [lon, lat, radiusKm]. */
  circle?: [number, number, number];
}

export interface GenerateCapResult {
  capXml: string;
  alertId: string;
  audioUrl: string | null;
  beepUrl: string | null;
  recordId: string;
  disasterEventId: string;
  language: string;
  severity: string;
  durationSec: number;
  provider: string;
  /** The voiced MP3 bytes (for the broadcast dispatcher). */
  audioBuffer: Buffer;
}

/**
 * Generate a CAP v1.2 alert for a disaster event: voice it, build the XML,
 * validate, persist, and return the audit row + audio URLs.
 */
export async function generateCapForEvent(
  disasterEventId: string,
  options: GenerateCapOptions = {},
): Promise<GenerateCapResult> {
  const event = await prisma.disasterEvent.findUnique({
    where: { id: disasterEventId },
  });
  if (!event) {
    throw new Error("Disaster event not found.");
  }

  const district = event.district ?? "";
  const disasterType = event.type as CapDisasterType;
  const language: TtsLanguage =
    options.language && isTtsLanguage(options.language) ? options.language : "hi";

  // 1. Resolve the per-disaster CAP preset + district overrides.
  const preset = resolveCapPreset({
    disasterType,
    district,
    severity: options.severity,
    urgency: options.urgency,
  });

  // 2. Pull shelter names for the description/instruction.
  const shelters = district
    ? await prisma.shelter.findMany({
        where: { district },
        select: { name: true },
        take: 5,
        orderBy: { name: "asc" },
      })
    : [];

  // 3. Voice the alert (Phase 2 pipeline) + store the audio.
  const shelterNames = shelters.map((s) => s.name).join(", ");
  const shelterNote = shelterNames
    ? ` Designated shelter locations include: ${shelterNames}.`
    : "";
  const description = `${preset.description}${shelterNote}`;

  const script = options.message?.trim()
    ? options.message.trim()
    : `${preset.headline}. ${description} ${preset.instruction}`;

  const tts = await generateAlertAudio({
    message: options.message?.trim() ? script : undefined,
    language,
    severity: "warning",
    district,
    disasterType,
  });

  const cacheKey = alertAudioCacheKey({ script: tts.script, language });
  const stored = await storeAlertAudio({
    cacheKey,
    voice: tts.voice.buffer,
    beep: tts.beep.buffer,
  });

  // 4. Build the affected area (caller polygon > caller circle > district).
  const area = resolveArea({ district, polygon: options.polygon, circle: options.circle });

  // 5. Assemble the CAP document.
  const sent = new Date();
  const effective = new Date(sent.getTime() + 5 * 60 * 1000);
  const expires = new Date(effective.getTime() + parseDurationMs(preset.duration));
  const identifier = `dl-${disasterEventId.slice(0, 8)}-${Date.now().toString(36)}`;

  const capInput = {
    identifier,
    sender: "safesphere.ai@ddma.gov.in",
    sent: sent.toISOString(),
    status: "Actual" as const,
    msgType: "Alert" as const,
    scope: "Public" as const,
    infos: [
      {
        language: BCP47[language],
        category: preset.category,
        event: preset.event,
        urgency: preset.urgency,
        severity: preset.severity,
        certainty: preset.certainty,
        effective: effective.toISOString(),
        expires: expires.toISOString(),
        senderName: "District Disaster Management Authority",
        headline: districtHeadline(preset, district),
        description,
        instruction: preset.instruction,
        areas: [area],
        resources: stored.audioUrl
          ? [
              {
                resourceDesc: "Emergency voice broadcast (MP3)",
                mimeType: "audio/mpeg",
                uri: stored.audioUrl,
              },
            ]
          : [],
      },
    ],
  };

  const validation = validateCapAlert(capInput);
  if (!validation.ok) {
    throw new Error(`CAP validation failed: ${validation.errors.join("; ")}`);
  }

  const capXml = buildCapAlert(capInput);

  // 6. Persist for the audit trail — cap_hash is the tamper-proofing
  // digest (Phase 8): recompute SHA-256(cap_xml) at review time and compare.
  const record = await prisma.capAlert.create({
    data: {
      alertId: identifier,
      disasterEventId,
      capXml,
      capHash: hashCapXml(capXml),
      audioUrl: stored.audioUrl,
      language: BCP47[language],
      severity: preset.severity,
      status: "pending",
    },
  });

  return {
    capXml,
    alertId: identifier,
    audioUrl: stored.audioUrl,
    beepUrl: stored.beepUrl,
    recordId: record.id,
    disasterEventId,
    language: BCP47[language],
    severity: preset.severity,
    durationSec: tts.voice.durationSec,
    provider: tts.voice.provider,
    audioBuffer: tts.voice.buffer,
  };
}

/** Resolve the CAP <area>: caller polygon > caller circle > district default. */
function resolveArea(input: {
  district: string;
  polygon?: Array<[number, number]>;
  circle?: [number, number, number];
}): CapArea {
  if (input.polygon && input.polygon.length >= 3) {
    return { areaDesc: `Affected area near ${input.district || "the disaster zone"}`, polygon: input.polygon };
  }
  if (input.circle) {
    return { areaDesc: `Affected area near ${input.district || "the disaster zone"}`, circle: input.circle };
  }
  const [lon, lat] = DISTRICT_CENTROIDS[input.district.trim().toLowerCase()] ?? [78.96, 20.59];
  return {
    areaDesc: input.district || "Affected area",
    circle: [lon, lat, 50],
  };
}

/** Convert "PT36H" style ISO 8601 durations to milliseconds. */
function parseDurationMs(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 24 * 60 * 60 * 1000;
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  const s = Number(match[3] ?? 0);
  return ((h * 60 + m) * 60 + s) * 1000;
}
