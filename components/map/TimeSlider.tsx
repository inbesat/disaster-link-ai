"use client";

import { useEffect, useState } from "react";

const MIN_HOURS = 0;
const MAX_HOURS = 72;
const STEP_HOURS = 12;
const TICKS = [0, 24, 48, 72];

type TimeSliderProps = {
  value: number;
  onChange: (hours: number) => void;
};

export default function TimeSlider({ value, onChange }: TimeSliderProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      onChange(value >= MAX_HOURS ? MIN_HOURS : value + STEP_HOURS);
    }, 700);
    return () => clearInterval(id);
  }, [playing, value, onChange]);

  return (
    <div className="eoc-panel pointer-events-auto absolute bottom-20 left-1/2 z-30 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="eoc-label text-accent">FORECAST HORIZON</p>
        <span className="text-sm font-semibold text-slate-100">{value}h</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent bg-accent/10 text-accent transition hover:bg-accent/25"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
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
          className="w-full"
          style={{ accentColor: "#38bdf8" }}
        />
      </div>

      <div className="mt-1.5 flex justify-between px-11 text-[10px] uppercase tracking-wider text-slate-500">
        {TICKS.map((h) => (
          <span key={h}>{h}h</span>
        ))}
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
