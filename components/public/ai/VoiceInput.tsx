"use client";

// ---------------------------------------------------------------------
// components/public/ai/VoiceInput.tsx — Phase 6 · Step 4 · Voice-first
// interface (regional language).
//
// Users with wet hands or low literacy need to SPEAK to the app, so the
// composer gets a massive, prominent microphone button. It drives the
// standard Web Speech API (SpeechRecognition / webkitSpeechRecognition):
//
//   1. Tap the mic → recognition starts; the button blooms red and an
//      inline strip above the composer shows pulsing soundwave bars,
//      "Listening…" and the live interim transcript.
//   2. Tap again (or the engine auto-ends) → the final transcript is
//      delivered via `onResult`; SahayakChat drops it into the input.
//   3. The recognition `lang` follows the app's active UI language
//      (en-IN, hi-IN, bn-IN, …) so a citizen speaks their own tongue —
//      the LLM backend handles any translation downstream.
//
// The typings + delivery logic mirror components/ui/VoiceInputButton.tsx
// (the project's established Web Speech pattern — duplicated here per
// convention, kept in sync). Unsupported browsers get a graceful
// simulated transcript so the demo never dies on a blocked mic.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { useTranslation } from "@/lib/i18n/LanguageContext";

/* ---------------------------------------------------------------------
   Minimal Web Speech API typings (kept in sync with VoiceInputButton
   and VoiceNoteReporter — the engine isn't in TypeScript's lib.dom).
   --------------------------------------------------------------------- */
type SRWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: new () => SRInstance;
    webkitSpeechRecognition?: new () => SRInstance;
  };

type SRInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: (e: SRResultEvent) => void;
  onend: (() => void) | null;
  onerror: (e: { error?: string }) => void;
  start: () => void;
  stop: () => void;
};

type SRResultEvent = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; [j: number]: { transcript: string } };
  };
};

/** App locales the Web Speech engines don't cover → closest supported one. */
const SPEECH_LOCALE_FALLBACK: Record<string, string> = {
  sat: "hi-IN",
  mai: "hi-IN",
  brx: "hi-IN",
  doi: "hi-IN",
  kok: "hi-IN",
  ks: "hi-IN",
  mni: "hi-IN",
  sa: "hi-IN",
  sd: "hi-IN",
};

/** Map the app's UI locale to a BCP-47 speech code (en → en-IN, hi → hi-IN). */
export function speechLocaleFor(locale: string): string {
  if (locale === "en") return "en-IN";
  return SPEECH_LOCALE_FALLBACK[locale] ?? `${locale}-IN`;
}

type VoiceInputProps = {
  /** Final transcript delivered when the user stops speaking. */
  onResult: (text: string) => void;
  /** Speech locale — defaults to Indian English. */
  lang?: string;
  /** Disable the mic (e.g. while a reply is being drafted). */
  disabled?: boolean;
};

const SUPPORTED = (): boolean =>
  typeof window !== "undefined" &&
  Boolean(
    (window as SRWindow).SpeechRecognition ||
      (window as SRWindow).webkitSpeechRecognition,
  );

export function VoiceInput({ onResult, lang = "en-IN", disabled = false }: VoiceInputProps) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [simulated, setSimulated] = useState(false);

  const recRef = useRef<SRInstance | null>(null);
  const timeoutRef = useRef<number | null>(null);
  // Refs mirror the transcript so the recognition callbacks (bound once)
  // always read the freshest accumulated text without stale closures.
  const finalRef = useRef("");
  const interimRef = useRef("");
  // Prevents double-delivery when both stop() AND the engine's onend fire.
  const deliveredRef = useRef(false);

  const deliver = useCallback(
    (text: string) => {
      if (deliveredRef.current) return;
      deliveredRef.current = true;
      const trimmed = text.trim();
      if (trimmed) onResult(trimmed);
      setListening(false);
      setInterim("");
      finalRef.current = "";
      interimRef.current = "";
    },
    [onResult],
  );

  const stopAndDeliver = useCallback(() => {
    recRef.current?.stop();
    deliver(
      `${finalRef.current}${finalRef.current && interimRef.current ? " " : ""}${interimRef.current}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliver]);

  const makeRecognition = useCallback((): SRInstance | null => {
    const w = window as SRWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let live = interimRef.current;
      let done = finalRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          done = done ? `${done} ${res[0].transcript}` : res[0].transcript;
        } else {
          live += res[0].transcript;
        }
      }
      finalRef.current = done;
      interimRef.current = live;
      setInterim(live);
    };
    rec.onerror = () => deliver(""); // engine error — strip closes cleanly
    rec.onend = () => stopAndDeliver(); // continuous ⇒ fires on stop()
    return rec;
  }, [lang, deliver, stopAndDeliver]);

  const startListening = () => {
    if (disabled) return;
    deliveredRef.current = false;
    setInterim("");
    finalRef.current = "";
    interimRef.current = "";
    triggerLightHaptic();

    if (!SUPPORTED()) {
      // No Web Speech API (or mic blocked in the demo browser) — simulate
      // a short regional-safe phrase so the pitch never stalls.
      setListening(true);
      setSimulated(true);
      timeoutRef.current = window.setTimeout(() => {
        setSimulated(false);
        deliver("Water level is rising near my home. Where should my family go?");
      }, 1600);
      return;
    }

    const rec = makeRecognition();
    if (!rec) {
      setListening(true);
      setSimulated(true);
      timeoutRef.current = window.setTimeout(() => {
        setSimulated(false);
        deliver("Water level is rising near my home. Where should my family go?");
      }, 1600);
      return;
    }
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const stopListening = () => {
    if (!listening) return;
    triggerLightHaptic();
    if (simulated) {
      // Simulated run — cancel: reset without delivering.
      deliveredRef.current = true;
      setListening(false);
      setSimulated(false);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      return;
    }
    stopAndDeliver();
  };

  useEffect(() => {
    return () => {
      // Never deliver a transcript into a closed sheet: mark delivered so
      // the onend fired by stop() below is a no-op.
      deliveredRef.current = true;
      recRef.current?.stop();
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <motion.button
        type="button"
        onClick={listening ? stopListening : startListening}
        disabled={disabled}
        aria-label={listening ? t("voice_stop") : t("voice_start")}
        aria-pressed={listening}
        title={listening ? t("voice_stop") : t("voice_start")}
        whileTap={{ scale: 0.9 }}
        whileHover={disabled ? undefined : { scale: 1.06 }}
        className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34d399] disabled:cursor-not-allowed disabled:opacity-40 ${
          listening
            ? "border-[#f87171]/70 bg-[#ef4444] bg-gradient-to-br from-[#ef4444] to-[#dc2626] text-white shadow-[0_0_24px_rgba(239,68,68,0.55)]"
            : "border-[#34d399]/40 bg-[#16a34a] bg-gradient-to-br from-[#16a34a] to-[#0d9488] text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] hover:border-[#34d399]"
        }`}
      >
        {/* Pulsing halo ring while listening. */}
        {listening && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border-2 border-[#f87171]"
            animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        {listening ? (
          <MicOff className="h-6 w-6" strokeWidth={2} aria-hidden />
        ) : (
          <Mic className="h-6 w-6" strokeWidth={2} aria-hidden />
        )}
      </motion.button>

      {/* Floating listening banner — anchored above the composer (the
          composer container is `relative` in SahayakChat), so the mic
          stays in the input row while the waveform hovers above it. */}
      <AnimatePresence>
        {listening && (
          <motion.div
            key="voice-strip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute inset-x-0 bottom-full pb-2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-[#f87171]/30 bg-[#0f172a]/95 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur">
              <Waveform />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[0.8125rem] font-bold uppercase tracking-wider text-[#fca5a5]">
                  <span
                    aria-hidden
                    className="h-2 w-2 animate-pulse rounded-full bg-[#f87171]"
                  />
                  {simulated ? t("voice_unsupported") : t("voice_listen")}
                </p>
                <p
                  className="mt-0.5 truncate text-sm text-white"
                  aria-live="polite"
                >
                  {interim || t("voice_hint")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------------------------------------------------------------
   Soundwave — four bars pulsing on staggered spring loops so they ripple
   like a live waveform instead of moving in lockstep.
   --------------------------------------------------------------------- */
function Waveform() {
  return (
    <span className="flex h-9 shrink-0 items-center gap-1" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="h-6 w-1.5 rounded-full bg-[#f87171]"
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.14,
            ease: "easeInOut",
          }}
        />
      ))}
    </span>
  );
}

export default VoiceInput;
