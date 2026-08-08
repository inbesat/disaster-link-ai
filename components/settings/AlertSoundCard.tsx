"use client";

// ---------------------------------------------------------------------
// components/settings/AlertSoundCard.tsx — Settings · Phase 2 · Step 6.
//
// Alert Sound & Haptics configuration for /settings/notifications:
//   • Critical Alert Tone dropdown — Standard Siren, Digital Chime,
//     Harsh Beep, Silent (Vibrate Only — plays nothing but still vibes).
//   • "▶ Test Audio" button replaying the tone via the Web Audio API
//     (synthesized, zero assets, works offline).
//   • Haptic toggle for supported mobile devices (navigator.vibrate).
//
// Tone synthesis mirrors the DisasterMap beep pattern so playback feels
// native to the platform; all tones are capped in amplitude.
// ---------------------------------------------------------------------

import { useRef, useState } from "react";
import {
  BellRing,
  Smartphone,
  Vibrate,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  HAPTIC_PATTERN,
  TONE_OPTIONS,
  TONE_PATTERNS,
  isSilentTone,
  toneDuration,
  toneOscillatorType,
  type ToneId,
} from "@/lib/alert-tone";

export default function AlertSoundCard({
  tone,
  hapticsEnabled,
  onToneChange,
  onHapticsChange,
}: {
  tone: ToneId;
  hapticsEnabled: boolean;
  onToneChange: (next: ToneId) => void;
  onHapticsChange: (next: boolean) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);

  function getAudioContext(): AudioContext {
    const Ctor: typeof AudioContext =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!audioRef.current) {
      audioRef.current = new Ctor();
    }
    if (audioRef.current.state === "suspended") {
      void audioRef.current.resume();
    }
    return audioRef.current;
  }

  function playTone(id: ToneId) {
    const pattern = TONE_PATTERNS[id];
    if (isSilentTone(id)) {
      // Silent tone — only vibrate if haptics are on.
      if (hapticsEnabled && "vibrate" in navigator) {
        try {
          navigator.vibrate(HAPTIC_PATTERN);
        } catch {
          /* unsupported */
        }
      }
      setPlaying(true);
      window.setTimeout(() => setPlaying(false), 400);
      return;
    }

    try {
      const ctx = getAudioContext();
      setPlaying(true);
      const now = ctx.currentTime;
      for (const step of pattern) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = toneOscillatorType(id);
        osc.frequency.value = step.freq;
        const start = now + step.start;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(step.gain, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + step.dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + step.dur + 0.05);
      }
      // Mirror the haptics while any warning rings.
      if (hapticsEnabled && "vibrate" in navigator) {
        try {
          navigator.vibrate(HAPTIC_PATTERN);
        } catch {
          /* unsupported */
        }
      }
      const total = toneDuration(id);
      window.setTimeout(() => setPlaying(false), (total + 0.1) * 1000);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <section
      data-settings-key="alert-sound"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
          <BellRing className="h-5 w-5 text-rose-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-rose-300/80">ALERT AUDIO</p>
          <h2 className="mt-0.5 text-lg font-bold">Alert Sound &amp; Haptics</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Pick the tone that breaks through the field noise — and let your phone
        join in.
      </p>

      {/* Critical alert tone dropdown */}
      <div className="mt-5 rounded-md border border-[#1c2740] bg-surface-muted/40 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label
              htmlFor="critical-tone"
              className="block text-xs font-semibold text-slate-400"
            >
              Critical Alert Tone
            </label>
            <select
              id="critical-tone"
              value={tone}
              onChange={(e) => onToneChange(e.target.value as ToneId)}
              className="mt-1.5 w-full rounded-md border border-[#2c3f6d] bg-[#0a0f1d] px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-rose-400"
            >
              {TONE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id} className="bg-[#0a0f1d] text-slate-300">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => playTone(tone)}
            disabled={playing}
            className="inline-flex items-center gap-2 self-end rounded-md border border-rose-400/40 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/20 disabled:opacity-60"
          >
            {playing ? (
              <span className="h-3 w-3 animate-pulse rounded-full bg-rose-400" aria-hidden />
            ) : (
              <Volume2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {playing ? "Playing…" : "▶ Test Audio"}
          </button>
        </div>

        <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          {tone === "silent" ? (
            <VolumeX className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          ) : (
            <Volume2 className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          )}
          {tone === "silent"
            ? "Silent mode: no audible alert — vibration only when haptics are on."
            : "Tone is synthesized on-device (Web Audio API); no audio files involved."}
        </p>
      </div>

      {/* Haptics toggle */}
      <div className="mt-4 flex items-center justify-between gap-4 rounded-md border border-[#1c2740] bg-surface-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-rose-500/10">
            <Vibrate className="h-4 w-4 text-rose-300" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Enable Haptic Feedback / Device Vibration
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Short vibration pulses accompany critical alerts on supported
              mobile devices.
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hapticsEnabled}
          aria-label="Enable haptic feedback"
          onClick={() => onHapticsChange(!hapticsEnabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            hapticsEnabled ? "bg-rose-500" : "bg-[#2c3f6d]"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
              hapticsEnabled ? "translate-x-[26px]" : "-translate-x-[2px]"
            }`}
          />
        </button>
      </div>

      {/* Helper footer */}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Smartphone className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Haptics follow your critical-alert channels and respect the Quiet
        Hours overrides above.
      </p>
    </section>
  );
}