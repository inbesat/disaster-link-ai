// ---------------------------------------------------------------------
// lib/tts/types.ts — Phase 26 · FM Radio Emergency Broadcasting
// Shared types for the AI Text-to-Speech alert voice pipeline (Phase 2).
// ---------------------------------------------------------------------

/** Supported Indian languages for the alert voice. */
export type TtsLanguage = "hi" | "en" | "bn" | "ta" | "te" | "mr" | "ml";

/** Runtime guard — matches a request language against the supported set. */
export function isTtsLanguage(value: unknown): value is TtsLanguage {
  return (
    typeof value === "string" &&
    ["hi", "en", "bn", "ta", "te", "mr", "ml"].includes(value)
  );
}

/** Alert severity — drives intro tone + urgency phrasing. */
export type AlertSeverity = "watch" | "warning" | "critical";

/** Natural calamity types the voice templates cover. */
export type DisasterType = "flood" | "cyclone" | "earthquake" | "heatwave";

/** The full request body for generating an alert voice. */
export interface AlertVoiceRequest {
  /** The alert text (if omitted, the disaster template is used). */
  message?: string;
  /** ISO 639-1 language code — 'hi' | 'en' | 'bn' | 'ta' | … */
  language: TtsLanguage;
  severity: AlertSeverity;
  district: string;
  disasterType: DisasterType;
  /** Template variables (river_name, shelter_names, magnitude, temp…). */
  templateVars?: Record<string, string>;
}

/** A single synthesized radio-broadcast-ready audio asset. */
export interface TtsAudioResult {
  /** Raw audio bytes (MP3 for the provider path, WAV for the beep). */
  buffer: Buffer;
  /** MIME type of `buffer` — 'audio/mpeg' | 'audio/wav'. */
  mime: "audio/mpeg" | "audio/wav";
  /** Estimated duration in seconds. */
  durationSec: number;
  /** Provider that produced the voice ('elevenlabs' | 'azure' | 'google'). */
  provider: TtsProviderName;
}

/** Which TTS backend produced the voice. */
export type TtsProviderName = "elevenlabs" | "azure" | "google";

/** Per-language voice selection for each provider family. */
export type LanguageVoiceMap = Record<
  TtsLanguage,
  { elevenlabs: string; azure: string; google: string; label: string }
>;
