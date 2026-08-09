"use client";

// ---------------------------------------------------------------------
// components/map/TimeSlider.tsx — UI/UX Phase 5 · Step 5.
//
// Predictive timeline control: a floating 0 → 72h slider pinned bottom-
// centre (desktop only) for scrubbing / animating the flood progression.
// Ticks read "Now / +12h / +24h / +48h / +72h", and a live label resolves
// the pointed-to hour into IST (e.g. "+24 Hours (Aug 10, 14:00 IST)"). The
// Play button simulates the timeline advancing every 700 ms and wraps at
// 72h. Kept controlled (`value`/`onChange`) so the map and this slider
// always agree.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";

const MIN_HOURS = 0;
const MAX_HOURS = 72;
const STEP_HOURS = 12;
const TICKS = [
  { h: 0, label: "Now" },
  { h: 12, label: "+12h" },
  { h: 24, label: "+24h" },
  { h: 48, label: "+48h" },
  { h: 72, label: "+72h" },
];

const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

type TimeSliderProps = {
  /** Hours ahead (0–72). */
  value: number;
  onChange: (hours: number) => void;
};

export default function TimeSlider({ value, onChange }: TimeSliderProps) {
  const [playing, setPlaying] = useState(false);
  // Mount-time IST clock so the label never causes a hydration mismatch.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => setNowMs(Date.now()), []);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      onChange(value >= MAX_HOURS ? MIN_HOURS : value + STEP_HOURS);
    }, 700);
    return () => clearInterval(id);
  }, [playing, value, onChange]);

  const forecastLabel =
    nowMs === null
      ? "Forecast: —"
      : value === 0
        ? "Forecast: Now (live)"
        : `Forecast: +${value} Hours (${IST_FORMATTER.format(new Date(nowMs + value * 3_600_000))})`;

  return (
    <div className="eoc-panel pointer-events-auto absolute bottom-6 left-1/2 z-30 hidden w-[22rem] max-w-[calc(100vw-2rem)] -translate-x-1/2 px-5 py-4 md:block">
      <div className="flex items-center justify-between gap-3">
        <p className="eoc-label text-accent">Forecast</p>
        <span className="text-sm font-semibold tabular-nums text-slate-100">
          {forecastLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause forecast animation" : "Play forecast animation"}
          aria-pressed={playing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent bg-accent/10 text-accent transition hover:bg-accent/25"
        >
          {playing ? (
            <Pause className="h-4 w-4" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
        </button>

        <input
          type="range"
          min={MIN_HOURS}
          max={MAX_HOURS}
          step={STEP_HOURS}
          value={value}
          onChange={(e) => {
            setPlaying(false);
            onChange(Number(e.target.value));
          }}
          aria-label="Forecast hours ahead"
          className="h-1.5 w-full cursor-pointer accent-[#38bdf8]"
        />
      </div>

      <div className="mt-1.5 flex justify-between px-0 text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {TICKS.map((tick) => (
          <span key={tick.h}>{tick.label}</span>
        ))}
      </div>
    </div>
  );
}
