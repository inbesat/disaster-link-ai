// ---------------------------------------------------------------------
// lib/tts/alert-voice-generator.ts — Phase 26 · FM Radio Emergency
// Broadcasting · Phase 2 · AI Text-to-Speech engine.
//
// The full alert-voice pipeline:
//
//   1. buildAlertScript(request)  → radio-ready script text (intro +
//      severity lead + disaster template/actions).
//   2. synthesizeVoice(script, lang) → MP3 128 kbps mono via the provider
//      chain (ElevenLabs → Azure → Google).
//   3. generateBeepWav()          → 1000 Hz / 0.5 s WAV tone for EWS
//      radio compliance, returned alongside the MP3.
//   4. generateAlertAudio()       → { voice, beep } ready for storage /
//      broadcast.
//
// The generator is pure (no network in the top-level orchestration beyond
// synthesizeVoice) so the template/beep layers stay unit-testable.
// ---------------------------------------------------------------------

import { generateBeepWav } from "./beep";
import { synthesizeVoice } from "./providers";
import { buildAlertScript } from "./templates";
import type { AlertVoiceRequest, TtsAudioResult } from "./types";

/** The 1000 Hz / 0.5 s radio-compliance tone (EWS). */
export interface RadioBeep {
  buffer: Buffer;
  mime: "audio/wav";
  durationSec: number;
}

export interface AlertAudioResult {
  /** The voiced alert (MP3 128 kbps mono, radio-optimized). */
  voice: TtsAudioResult;
  /** The compliance beep to prepend on broadcast. */
  beep: RadioBeep;
  /** The full broadcast script that was spoken. */
  script: string;
}

/**
 * Generate the complete radio-broadcast audio for an alert:
 * the voiced MP3 plus the compliance beep.
 */
export async function generateAlertAudio(
  request: AlertVoiceRequest,
): Promise<AlertAudioResult> {
  const script = buildAlertScript(request);
  const voice = await synthesizeVoice(script, request.language);
  const beepBuffer = generateBeepWav();

  return {
    voice,
    beep: {
      buffer: beepBuffer,
      mime: "audio/wav",
      durationSec: 0.5,
    },
    script,
  };
}
