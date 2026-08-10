"use client";

// ---------------------------------------------------------------------
// hooks/useTextToSpeech.ts — Phase 3 · Step 6 · Text-to-Speech engine.
//
// Wraps the browser window.speechSynthesis API so alert copy can be read
// aloud for visually impaired users or anyone panicking in the dark.
//
//   • speakAlert(text)  — cancels anything queued, then speaks. Picks an
//     English-Indian voice when available (falls back to any English or
//     the default). Returns true if speech was started, false when the
//     API is unavailable (SSR, old browsers) — callers show/hide the
//     Read Aloud button accordingly.
//   • stopSpeaking()    — cancels in-flight speech.
//   • useTextToSpeech() — hook form with a `speaking` flag driven by the
//     synth's end/error events, so the button can flip to a Stop state.
//
// Everything is guarded: no window access at module scope, no throwing
// on unsupported platforms (same pattern as hooks/useHaptics).
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

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

/** Prefer an Indian-English voice, then any English, else the default. */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return (
    voices.find((v) => v.lang === "en-IN") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
    null
  );
}

/** Speak alert copy. Returns true when speech actually started. */
export function speakAlert(text: string): boolean {
  if (!supportsSpeech()) return false;
  try {
    window.speechSynthesis.cancel(); // never stack stale speech on new alerts
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
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

  const speak = (text: string): boolean => {
    if (!speakAlert(text)) return false;
    setSpeaking(true);
    clearWatchdog();
    watchdogRef.current = window.setTimeout(() => {
      watchdogRef.current = null;
      setSpeaking(false);
    }, SPEAKING_WATCHDOG_MS);
    return true;
  };

  const stop = () => {
    clearWatchdog();
    stopSpeaking();
    setSpeaking(false);
  };

  return { speak, stop, speaking, supported: supportsSpeech() };
}

export default useTextToSpeech;
