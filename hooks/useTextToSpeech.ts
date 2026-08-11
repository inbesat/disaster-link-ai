"use client";

// ---------------------------------------------------------------------
// hooks/useTextToSpeech.ts — Phase 3 · Step 6 · Text-to-Speech engine.
//
// Wraps the browser window.speechSynthesis API so alert copy can be read
// aloud for visually impaired users or anyone panicking in the dark.
// Phase 13 · Step 7 extends it with language-aware narration for the low-
// literacy onboarding carousel: speak(text, lang) picks a voice matching
// the BCP-47 tag (e.g. "hi-IN") and sets utterance.lang, falling back to
// Indian-English when no matching voice exists.
//
//   • speakAlert(text, lang?) — cancels anything queued, then speaks.
//     Returns true if speech was started, false when the API is
//     unavailable (SSR, old browsers) — callers show/hide the button.
//   • stopSpeaking()    — cancels in-flight speech.
//   • useTextToSpeech() — hook form with a `speaking` flag driven by the
//     synth's end/error events, so the button can flip to a Stop state.
//
// Everything is guarded: no window access at module scope, no throwing
// on unsupported platforms (same pattern as hooks/useHaptics).
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";

/**
 * If a platform never fires the synth's `end` event (backgrounded tab,
 * interrupted utterance), the button would stay stuck in its Stop state.
 * This watchdog clears `speaking` after the generous max alert length.
 */
const SPEAKING_WATCHDOG_MS = 60_000;

/** True when the browser can speak (false on the server / old engines). */
export function supportsSpeech(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Map a Bharat Shakti UI locale to the BCP-47 speech tag most likely to
 * have a system voice on Indian devices. Locales without reliable voice
 * coverage return undefined → narration falls back to English.
 */
const LOCALE_VOICE_LANGS: Partial<Record<Locale, string>> = {
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  ur: "ur-IN",
  or: "or-IN",
  as: "as-IN",
  ne: "ne-IN",
};

export function voiceLangForLocale(locale: Locale): string | undefined {
  return LOCALE_VOICE_LANGS[locale];
}

/**
 * Prefer a voice matching the requested BCP-47 tag, then Indian-English,
 * then any English, else the default.
 */
function pickVoice(lang?: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  if (lang) {
    return (
      voices.find((v) => v.lang === lang) ??
      voices.find((v) => v.lang.toLowerCase().startsWith(lang.split("-")[0])) ??
      null
    );
  }
  return (
    voices.find((v) => v.lang === "en-IN") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
    null
  );
}

/** Speak text (optionally in a language). Returns true when speech started. */
export function speakAlert(text: string, lang?: string): boolean {
  if (!supportsSpeech()) return false;
  try {
    window.speechSynthesis.cancel(); // never stack stale speech on new alerts
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    // Always set the language hint — engines without an exact voice match
    // still route the utterance to the closest locale.
    if (lang) utterance.lang = lang;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/** Cancel any in-flight speech. */
export function stopSpeaking(): void {
  if (!supportsSpeech()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* unsupported platform */
  }
}

/** Hook form — `speaking` flips on speak() and clears on end/error. */
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const watchdogRef = useRef<number | null>(null);

  const clearWatchdog = () => {
    if (watchdogRef.current !== null) {
      window.clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  };

  useEffect(() => {
    if (!supportsSpeech()) return;
    const onEnd = () => {
      clearWatchdog();
      setSpeaking(false);
    };
    const synth = window.speechSynthesis;
    synth.addEventListener("end", onEnd);
    synth.addEventListener("error", onEnd);
    return () => {
      synth.removeEventListener("end", onEnd);
      synth.removeEventListener("error", onEnd);
      clearWatchdog();
      // Don't leave speech running if the consumer unmounts mid-alert.
      stopSpeaking();
    };
  }, []);

  const speak = useCallback((text: string, lang?: string): boolean => {
    if (!speakAlert(text, lang)) return false;
    setSpeaking(true);
    clearWatchdog();
    watchdogRef.current = window.setTimeout(() => {
      watchdogRef.current = null;
      setSpeaking(false);
    }, SPEAKING_WATCHDOG_MS);
    return true;
  }, []);

  const stop = useCallback(() => {
    clearWatchdog();
    stopSpeaking();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported: supportsSpeech() };
}

export default useTextToSpeech;
