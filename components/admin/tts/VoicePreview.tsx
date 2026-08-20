"use client";

// ---------------------------------------------------------------------
// components/admin/tts/VoicePreview.tsx — Phase 26 · AI Alert Voice
// Preview. Generate radio-ready emergency audio and preview it inline.
//
// The form maps 1:1 to POST /api/tts/generate. On success it shows the
// provider + duration, plays the 1000 Hz beep then the voice, exposes the
// MP3 URL and the exact spoken script, and offers a download.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  Download,
  Loader2,
  Play,
  Radio,
  Volume2,
  FileText,
  CheckCircle2,
  Database,
} from "lucide-react";

type Language = "hi" | "en" | "bn" | "ta" | "te" | "mr" | "ml";
type Severity = "watch" | "warning" | "critical";
type DisasterType = "flood" | "cyclone" | "earthquake" | "heatwave";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "hi", label: "Hindi" },
  { value: "en", label: "English" },
  { value: "bn", label: "Bengali" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
  { value: "ml", label: "Malayalam" },
];

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "watch", label: "Watch" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

const DISASTER_TYPES: { value: DisasterType; label: string }[] = [
  { value: "flood", label: "Flood" },
  { value: "cyclone", label: "Cyclone" },
  { value: "earthquake", label: "Earthquake" },
  { value: "heatwave", label: "Heatwave" },
];

const TEMPLATE_DRAFTS: Record<DisasterType, string> = {
  flood:
    "Heavy rainfall has caused the Ganga to cross the danger mark. Residents of riverside wards should move to higher ground immediately.",
  cyclone:
    "Cyclone Remal is approaching the coast with wind speeds of 120 km/h. Stay indoors and secure loose objects.",
  earthquake:
    "A seismic event of magnitude 6.2 has been detected. Drop, cover and hold on until the shaking stops.",
  heatwave:
    "Extreme heatwave conditions are forecast with temperatures reaching 47°C. Avoid outdoor activity between 11 AM and 4 PM.",
};

interface GenerateResult {
  ok: boolean;
  audioUrl: string | null;
  beepUrl: string | null;
  audioDataUri: string | null;
  beepDataUri: string | null;
  durationSec: number;
  provider: string;
  script: string;
  cacheKey: string;
  cached: boolean;
}

export default function VoicePreview() {
  const [language, setLanguage] = useState<Language>("hi");
  const [severity, setSeverity] = useState<Severity>("warning");
  const [disasterType, setDisasterType] = useState<DisasterType>("flood");
  const [district, setDistrict] = useState("Patna");
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const [waveform, setWaveform] = useState<number[] | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopPlayback = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlaying(false);
    setProgress(0);
  }, []);

  /**
   * Decode the generated audio into per-bucket peak amplitudes so the
   * waveform bars mirror the actual voiced alert (Web Audio, no libs).
   */
  async function computeWaveformPeaks(src: string): Promise<number[] | null> {
    try {
      const response = await fetch(src);
      const arrayBuffer = await response.arrayBuffer();
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      const ctx = new AudioCtx();
      try {
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        const channel = audioBuffer.getChannelData(0);
        const BUCKETS = 96;
        const step = Math.max(1, Math.floor(channel.length / BUCKETS));
        const peaks: number[] = [];
        for (let i = 0; i < BUCKETS; i += 1) {
          let max = 0;
          const start = i * step;
          const end = Math.min(start + step, channel.length);
          for (let j = start; j < end; j += 1) {
            const value = Math.abs(channel[j]);
            if (value > max) max = value;
          }
          peaks.push(max);
        }
        return peaks;
      } finally {
        void ctx.close();
      }
    } catch {
      return null;
    }
  }

  // Rebuild the waveform whenever a new alert is generated.
  useEffect(() => {
    let cancelled = false;
    setWaveform(null);
    setProgress(0);
    const src = result?.audioUrl ?? result?.audioDataUri;
    if (!src) {
      setWaveform([]);
      return;
    }
    void computeWaveformPeaks(src).then((peaks) => {
      if (!cancelled) setWaveform(peaks ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [result]);

  // Redraw the waveform bars when peaks or playback progress change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveform || waveform.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(dpr, dpr);
    context.clearRect(0, 0, width, height);

    const barWidth = Math.max(2, width / waveform.length - 2);
    const mid = height / 2;
    waveform.forEach((value, index) => {
      const barHeight = Math.max(2, Math.min(1, value) * (height - 8));
      const x = (index * width) / waveform.length + 1;
      const played = index / waveform.length <= progress;
      context.fillStyle = played
        ? "rgba(251, 191, 36, 0.9)" // amber-400 — played portion
        : "rgba(30, 41, 59, 0.9)"; // slate-800 — pending portion
      context.fillRect(x, mid - barHeight / 2, barWidth, barHeight);
    });
  }, [waveform, progress]);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          severity,
          disasterType,
          district,
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json()) as GenerateResult & { error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Generation failed.");
        return;
      }
      setResult(data);
      toast.success(data.cached ? "Served from 24 h cache." : "Audio generated.");
    } catch (error: unknown) {
      console.error("TTS generation failed:", error);
      toast.error("Could not reach the TTS service.");
    } finally {
      setGenerating(false);
    }
  }

  async function play() {
    if (!result) return;
    stopPlayback();

    const playSrc = (src: string) =>
      new Promise<void>((resolve) => {
        const audio = new Audio(src);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        void audio.play();
      });

    setPlaying(true);
    // Compliance tone first, then the voiced alert.
    if (result.beepUrl || result.beepDataUri) {
      await playSrc(result.beepUrl ?? result.beepDataUri!);
    }
    const voiceSrc = result.audioUrl ?? result.audioDataUri;
    if (!voiceSrc) {
      setPlaying(false);
      return;
    }
    await new Promise<void>((resolve) => {
      const audio = new Audio(voiceSrc);
      audioRef.current = audio;
      audio.addEventListener("timeupdate", () => {
        if (audio.duration && Number.isFinite(audio.duration)) {
          setProgress(audio.currentTime / audio.duration);
        }
      });
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
        resolve();
      };
      audio.onerror = () => {
        setPlaying(false);
        setProgress(0);
        resolve();
      };
      void audio.play();
    });
  }

  function download() {
    if (!result) return;
    const src = result.audioUrl ?? result.audioDataUri;
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = `alert-${result.cacheKey}.mp3`;
    a.click();
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-panel-border bg-primary px-3 py-2 text-sm text-foreground outline-none transition focus:border-amber-400/50";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---------------------------------------------------------- Config */}
      <section className="rounded-lg border border-panel-border bg-panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Radio className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Alert Configuration
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-400">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className={inputClass}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className={inputClass}
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Disaster Type</label>
            <select
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value as DisasterType)}
              className={inputClass}
            >
              {DISASTER_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">District</label>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-400">
              Custom Message <span className="text-slate-600">(optional)</span>
            </label>
            <button
              type="button"
              onClick={() => setMessage(TEMPLATE_DRAFTS[disasterType])}
              className="text-[0.6875rem] font-medium text-amber-400/80 transition hover:text-amber-300"
            >
              Use {disasterType} draft
            </button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Leave blank to use the built-in disaster template. A custom message overrides the template."
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="mt-5 inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {generating ? "Generating…" : "Generate Alert Voice"}
        </button>
      </section>

      {/* ---------------------------------------------------------- Preview */}
      <section className="rounded-lg border border-panel-border bg-panel p-5">
        <div className="mb-4 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Preview Player
          </h2>
        </div>

        {!result ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-md border border-dashed border-panel-border text-center">
            <Volume2 className="mb-3 h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">
              Generate an alert to preview the radio-ready audio here.
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Plays the 1000 Hz compliance beep, then the AI voice.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md bg-primary p-3">
                <p className="text-[0.6875rem] uppercase tracking-wider text-slate-500">
                  Provider
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-foreground">
                  {result.provider}
                </p>
              </div>
              <div className="rounded-md bg-primary p-3">
                <p className="text-[0.6875rem] uppercase tracking-wider text-slate-500">
                  Duration
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {result.durationSec.toFixed(1)} s
                </p>
              </div>
              <div className="rounded-md bg-primary p-3">
                <p className="text-[0.6875rem] uppercase tracking-wider text-slate-500">
                  Cache
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-foreground">
                  {result.cached ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Hit
                    </>
                  ) : (
                    <>
                      <Database className="h-3.5 w-3.5 text-amber-400" /> Miss
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-panel-border bg-primary p-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
                  <Activity className="h-3 w-3" /> Waveform
                </p>
                {waveform === null ? (
                  <span className="text-[0.6875rem] text-slate-600">
                    Analyzing audio…
                  </span>
                ) : waveform.length === 0 ? (
                  <span className="text-[0.6875rem] text-slate-600">Unavailable</span>
                ) : null}
              </div>
              {waveform && waveform.length > 0 ? (
                <canvas
                  ref={canvasRef}
                  className="mt-2 h-16 w-full"
                  aria-label="Alert audio waveform"
                />
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={playing ? stopPlayback : play}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Play className="h-4 w-4" />
                {playing ? "Stop" : "Play (beep + voice)"}
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-2 rounded-md border border-panel-border bg-primary px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-amber-300"
              >
                <Download className="h-4 w-4" />
                MP3
              </button>
            </div>

            <div className="rounded-md border border-panel-border bg-primary p-3">
              <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
                <FileText className="h-3 w-3" /> Spoken Script
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {result.script}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
