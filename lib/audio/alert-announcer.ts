// ---------------------------------------------------------------------
// lib/audio/alert-announcer.ts — Phase 11 · Native TTS fallback for alert
// voice announcements (works offline).
//
// announceAlert() walks a best-effort channel chain so a critical alert is
// always voiced on every device, even when the Web Speech API is missing
// (some Android WebViews / iOS):
//
//   1. Web Speech TTS (speechSynthesis) — the primary, spoken alert copy.
//   2. Pre-recorded alert clip (public/demo-audio/*.wav, per alert type +
//      language) — a native-quality voice that plays offline.
//   3. Vibration pattern (navigator.vibrate) — silent-device fallback.
//
// Every channel is injectable for node tests; nothing touches `window` at
// module scope.
// ---------------------------------------------------------------------

export type AlertType = "flood" | "earthquake" | "cyclone" | "general";
export type AnnounceChannel = "tts" | "clip" | "vibration" | "none";

export type SpeakFn = (text: string, lang?: string) => boolean;
export type PlayClipFn = (url: string) => Promise<boolean>;
export type VibrateFn = (pattern: number | number[]) => boolean;

/** Base names of the pre-recorded clips (public/demo-audio). */
const CLIP_BASE: Partial<Record<AlertType, string>> = {
  flood: "flood",
  earthquake: "earthquake",
  cyclone: "cyclone",
};

/**
 * Resolves the pre-recorded clip URL for an alert type + language. Only the
 * demo clips ship today (hi/en), so any non-Hindi locale falls back to the
 * English clip; unknown alert types return null (skip straight to vibration).
 */
export function alertClipFor(alertType: AlertType | string | undefined, lang?: string): string | null {
  const base = CLIP_BASE[alertType as AlertType];
  if (!base) return null;
  const isHindi = !!lang && lang.toLowerCase().startsWith("hi");
  return `/demo-audio/${base}_${isHindi ? "hi" : "en"}.wav`;
}

/** Primary channel — Web Speech API (guarded, non-throwing). */
export function speakAlertChannel(text: string, lang?: string, speak?: SpeakFn): boolean {
  if (speak) return speak(text, lang);
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (lang) utterance.lang = lang;
    utterance.rate = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/** Second channel — plays the pre-recorded clip, awaiting the play() gate. */
export async function playAlertClip(url: string, play?: PlayClipFn): Promise<boolean> {
  if (play) return play(url);
  if (typeof Audio === "undefined") return false;
  try {
    const audio = new Audio(url);
    audio.volume = 1;
    await audio.play();
    return true;
  } catch {
    // Autoplay blocked / missing file — fall through.
    return false;
  }
}

/** Final channel — vibration pattern (silent devices). */
export function vibrateAlert(pattern: number | number[] = [300, 150, 300], vibrate?: VibrateFn): boolean {
  if (vibrate) return vibrate(pattern);
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

export interface AnnounceAlertOptions {
  text: string;
  lang?: string;
  alertType?: AlertType | string;
  speak?: SpeakFn;
  playClip?: PlayClipFn;
  vibrate?: VibrateFn;
}

/**
 * Announces an alert with the best available channel (TTS → clip →
 * vibration). Resolves the channel that actually fired.
 */
export async function announceAlert(options: AnnounceAlertOptions): Promise<AnnounceChannel> {
  if (speakAlertChannel(options.text, options.lang, options.speak)) return "tts";

  const clipUrl = alertClipFor(options.alertType, options.lang);
  if (clipUrl) {
    const played = await playAlertClip(clipUrl, options.playClip);
    if (played) return "clip";
  }

  if (vibrateAlert(undefined, options.vibrate)) return "vibration";
  return "none";
}

export default announceAlert;