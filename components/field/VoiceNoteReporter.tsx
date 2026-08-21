"use client";

import { useMemo, useRef, useState } from "react";
import { Mic, MicOff, Volume2, HeartPulse } from "lucide-react";

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

// Keyword → category auto-tag rules over the transcribed text.
const TAGS: { label: string; keywords: string[]; icon: "medical" | "flood" }[] = [
  { label: "Medical Emergency", keywords: ["medicine", "doctor", "injur", "ambulance", "hospital", "first aid"], icon: "medical" },
  { label: "Flood / Water", keywords: ["water", "flood", "rain", "rising", "bridge", "boat"], icon: "flood" },
];

export default function VoiceNoteReporter() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [supported] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const w = window as SRWindow;
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SRInstance | null>(null);

  const tag = useMemo(() => {
    const low = transcript.toLowerCase();
    for (const t of TAGS) {
      if (t.keywords.some((k) => low.includes(k))) return t;
    }
    return null;
  }, [transcript]);

  function makeRecognition(): SRInstance | null {
    const w = window as SRWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          setTranscript((prev) => (prev ? `${prev} ${res[0].transcript}` : res[0].transcript));
        } else {
          interim += res[0].transcript;
        }
      }
      if (interim) setTranscript((prev) => (prev ? `${prev} ${interim}` : interim));
    };
    rec.onerror = (e) => {
      setError(
        e.error === "not-allowed" ? "Microphone permission blocked. Use “Simulate Voice Input”." : `Recognition error: ${e.error ?? "unknown"}`,
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    return rec;
  }

  function toggleListening() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    setError(null);
    const rec = makeRecognition();
    if (!rec) {
      setError("Speech recognition is not supported in this browser. Use “Simulate Voice Input”.");
      return;
    }
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone.");
    }
  }

  function simulate() {
    setListening(false);
    recRef.current?.stop();
    setTranscript(
      "Water level rising rapidly near Rajendra Nagar bridge, need 2 rescue boats immediately",
    );
    setError(null);
  }

  return (
    <section className="rounded-xl border-2 border-panel-border bg-panel-deep p-5">
      <header className="flex items-center gap-2">
        {tag?.icon === "medical" ? (
          <HeartPulse className="h-5 w-5 text-red-400" />
        ) : (
          <Volume2 className="h-5 w-5 text-cyan-300" />
        )}
        <h2 className="text-lg font-bold uppercase tracking-wider text-cyan-300">
          Voice Field Note
        </h2>
        {tag && (
          <span
            className={`ml-auto rounded-full border px-3 py-1 text-sm font-bold ${
              tag.icon === "medical"
                ? "border-red-400/50 bg-red-500/10 text-red-300"
                : "border-sky-400/50 bg-sky-500/10 text-sky-300"
            }`}
          >
            {tag.label}
          </span>
        )}
      </header>

      <p className="mt-1 text-base text-gray-400">
        Tap the mic and speak to dictate hands-free field notes.
      </p>

      {/* Pulse-able mic trigger */}
      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={toggleListening}
          disabled={!supported && !listening}
          aria-label="Toggle voice recording"
          className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 ${
            listening
              ? "border-red-400 bg-red-500/25 text-red-300"
              : "border-cyan-400/60 bg-cyan-500/15 text-cyan-300"
          } transition active:scale-95 disabled:opacity-40`}
        >
          {listening ? (
            <>
              <MicOff className="h-12 w-12" />
              <span className="absolute -bottom-6 text-xs font-bold text-red-300">TAP TO STOP</span>
            </>
          ) : (
            <Mic className="h-14 w-14" />
          )}
          {listening && <WaveBars />}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border-2 border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      {/* Transcribed note */}
      <textarea
        id="voice-note"
        readOnly
        value={transcript}
        placeholder="Your dictated note will appear here…"
        className="mt-4 min-h-[120px] w-full resize-y rounded-2xl border-2 border-panel-border bg-[#080e1c] px-4 py-3 text-base leading-relaxed text-gray-100 placeholder:text-gray-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 focus:outline-none"
      />

      {/* Demo helper */}
      <button
        type="button"
        onClick={simulate}
        className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-panel-borderStrong bg-surface px-4 text-base font-semibold text-amber-300 transition active:scale-[0.98]"
      >
        <Volume2 className="h-5 w-5" />
        Simulate Voice Input
      </button>

      {tag && (
        <p className="mt-2 text-sm text-gray-400">
          Auto-tagged as <span className="font-bold text-amber-300">{tag.label}</span>.
        </p>
      )}
    </section>
  );
}

// Little progress-wave bars animating while listening.
function WaveBars() {
  return (
    <span className="absolute bottom-3 flex items-end gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="wave-bar w-1 rounded-full bg-red-400"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
      <style>{`
        @keyframes waveUp { 0%,100% { height: 6px } 50% { height: 26px } }
        .wave-bar { height: 6px; animation: waveUp 0.8s ease-in-out infinite; }
      `}</style>
    </span>
  );
}