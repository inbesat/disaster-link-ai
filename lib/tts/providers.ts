// ---------------------------------------------------------------------
// lib/tts/providers.ts — Phase 26 · TTS provider chain.
//
// Chain order: ElevenLabs (primary — most natural Indian-accented voices,
// multilingual v2 model) → Azure Neural TTS (fallback) → Google Cloud TTS
// (emergency fallback, most reliable uptime). Each returns a mono MP3
// buffer at 128 kbps, optimized for radio broadcast. Providers with no
// configured key are skipped — never a placeholder key sent upstream.
//
// The message script is passed in the language the caller chose; the voice
// id is resolved per-provider from lib/tts/languages.ts so the SAME script
// speaks Hindi/Marathi/Bengali/Tamil etc. correctly.
// ---------------------------------------------------------------------

import { TTS_LANGUAGE_VOICES } from "./languages";
import type { TtsAudioResult, TtsLanguage, TtsProviderName } from "./types";

const ELEVENLABS_BASE = "https://api.elevenlabs.io";
const AZURE_TTS_BASE = "https://{region}.tts.speech.microsoft.com/cognitiveservices/v1";
const GOOGLE_TTS_BASE = "https://texttospeech.googleapis.com/v1/text:synthesize";

/** A real key is longer than a placeholder — anything else is ignored. */
function hasKey(value: string | undefined): value is string {
  return Boolean(value && value.length > 8);
}

/** Shared timeout for every TTS call (slow halls/airport wifi). */
const TTS_TIMEOUT_MS = 20_000;

/**
 * Estimated speaking duration from character count — used for cache headers
 * and the radio scheduler. ~14 chars/sec is a reasonable TTS pacing.
 */
export function estimateDurationSec(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 2.2));
}

// ---------------------------------------------------------------------
// ElevenLabs (primary)
// ---------------------------------------------------------------------

async function synthesizeElevenLabs(
  text: string,
  language: TtsLanguage,
): Promise<TtsAudioResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!hasKey(apiKey)) {
    throw new Error("ELEVENLABS_API_KEY is not configured.");
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || TTS_LANGUAGE_VOICES[language].elevenlabs;
  const url = `${ELEVENLABS_BASE}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.45, similarity_boost: 0.6 },
    }),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    mime: "audio/mpeg",
    durationSec: estimateDurationSec(text),
    provider: "elevenlabs",
  };
}

// ---------------------------------------------------------------------
// Azure Neural TTS (fallback)
// ---------------------------------------------------------------------

/**
 * Build the Azure SSML payload. Azure speaks plain text inside <voice> —
 * punctuation and numbers get the correct regional pronunciation. The
 * language attribute is derived from the voice id (e.g. hi-IN-…).
 */
function azureSsml(voice: string, text: string): string {
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" ` +
    `xml:lang="${voice.split("-").slice(0, 2).join("-")}">` +
    `<voice name="${voice}"><break time="300ms"/>${escapeXml(text)}</voice></speak>`
  );
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function synthesizeAzure(
  text: string,
  language: TtsLanguage,
): Promise<TtsAudioResult> {
  const apiKey = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION;
  if (!hasKey(apiKey) || !region) {
    throw new Error("AZURE_TTS_KEY / AZURE_TTS_REGION are not configured.");
  }

  const voice = TTS_LANGUAGE_VOICES[language].azure;
  const url = AZURE_TTS_BASE.replace("{region}", region);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
      "User-Agent": "disaster-response-platform",
    },
    body: azureSsml(voice, text),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Azure TTS failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    buffer,
    mime: "audio/mpeg",
    durationSec: estimateDurationSec(text),
    provider: "azure",
  };
}

// ---------------------------------------------------------------------
// Google Cloud TTS (emergency fallback)
// ---------------------------------------------------------------------

async function synthesizeGoogle(
  text: string,
  language: TtsLanguage,
): Promise<TtsAudioResult> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!hasKey(apiKey)) {
    throw new Error("GOOGLE_TTS_API_KEY is not configured.");
  }

  const voiceName = TTS_LANGUAGE_VOICES[language].google;
  const response = await fetch(GOOGLE_TTS_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: voiceName.split("-").slice(0, 2).join("-"), name: voiceName },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.0,
        pitch: 0,
      },
    }),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Google TTS failed (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }

  const json = (await response.json()) as { audioContent?: string };
  if (!json.audioContent) {
    throw new Error("Google TTS returned no audio content.");
  }

  return {
    buffer: Buffer.from(json.audioContent, "base64"),
    mime: "audio/mpeg",
    durationSec: estimateDurationSec(text),
    provider: "google",
  };
}

// ---------------------------------------------------------------------
// Chain
// ---------------------------------------------------------------------

/**
 * Synthesize speech through the first healthy provider. Returns the audio
 * and the name of the provider that produced it. Throws only when every
 * configured provider fails.
 */
export async function synthesizeVoice(
  text: string,
  language: TtsLanguage,
): Promise<TtsAudioResult> {
  const attempts: Array<() => Promise<TtsAudioResult>> = [
    () => synthesizeElevenLabs(text, language),
    () => synthesizeAzure(text, language),
    () => synthesizeGoogle(text, language),
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      // Fall through to the next provider.
    }
  }

  throw lastError ?? new Error("No TTS provider available.");
}

/** Resolve a provider name → human label for the UI. */
export const PROVIDER_LABELS: Record<TtsProviderName, string> = {
  elevenlabs: "ElevenLabs",
  azure: "Azure Neural",
  google: "Google Cloud",
};
