"use client";

// ---------------------------------------------------------------------
// components/gov/map/TimeSliderControl.tsx — Phase 8 · Step 5 ·
// The 72-Hour Predictive Time Slider.
//
// A wide panel floating at the bottom-centre of the Gov Map Workspace.
// It drives `forecastHour` (0–72h) — the state the map uses to scale the
// flood polygons and simulate rising water. Includes:
//   • a range slider with tick marks every 12 hours
//   • a Play button that auto-increments the hour until the forecast
//     window ends (then becomes Replay, restarting the sweep)
//   • a live status chip + extent factor readout from the pure
//     gov-flood-forecast helpers
// ---------------------------------------------------------------------

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Brain, Pause, Play, RotateCcw } from "lucide-react";
import {
  floodScaleForHour,
  floodStatusForHour,
  FORECAST_HOURS,
  FORECAST_TICKS,
  type FloodStatus,
} from "@/lib/map/gov-flood-forecast";

type TimeSliderControlProps = {
  /** Current forecast hour (0–72), owned by the workspace. */
  hour: number;
  /** Setter for the hour — typed as a state setter so the play loop can
   * use the functional (prev → next) form and the slider/replay the
   * literal form. */
  onChange: Dispatch<SetStateAction<number>>;
};

/** Status chip colours — the flood outlook scales with the hour. */
const STATUS_STYLES: Record<FloodStatus, string> = {
  Steady:
    "border-severity-green-400/30 bg-severity-green-400/10 text-severity-green-300",
  Rising:
    "border-severity-amber-400/30 bg-severity-amber-400/10 text-severity-amber-300",
  Peak: "border-severity-red-400/30 bg-severity-red-400/15 text-severity-red-300",
};

export function TimeSliderControl({ hour, onChange }: TimeSliderControlProps) {
  const [playing, setPlaying] = useState(false);

  // Auto-increment while playing (≈ 7s for a full 72h sweep).
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      onChange((h: number) => Math.min(h + 1, FORECAST_HOURS));
    }, 100);
    return () => window.clearInterval(id);
  }, [playing, onChange]);

  // Stop the sweep at the end of the forecast window.
  useEffect(() => {
    if (playing && hour >= FORECAST_HOURS) setPlaying(false);
  }, [playing, hour]);

  const status = floodStatusForHour(hour);
  const atEnd = hour >= FORECAST_HOURS;

  const handlePlayClick = () => {
    if (playing) {
      setPlaying(false);
    } else if (atEnd) {
      onChange(0); // Replay the sweep from t0.
      setPlaying(true);
    } else {
      setPlaying(true);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 z-10 w-[min(92vw,38rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-panel-deep/90 px-5 py-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      {/* Header row — title, status chip, play, hour readout. */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Brain aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/70">
            XGBoost · 72-Hour Flood Forecast
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide ${STATUS_STYLES[status]}`}
          >
            {status}
          </span>

          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={playing ? "Pause forecast" : atEnd ? "Replay forecast" : "Play forecast"}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:scale-105 hover:bg-white/10 active:scale-95"
          >
            {playing ? (
              <Pause aria-hidden="true" className="h-4 w-4" />
            ) : atEnd ? (
              <RotateCcw aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
            ) : (
              <Play aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
            )}
          </button>

          <p className="min-w-[3.5rem] text-right font-mono text-lg font-bold tabular-nums text-white">
            T+{String(hour).padStart(2, "0")}h
          </p>
        </div>
      </div>

      {/* Slider — 0–72h, ticks every 12h. */}
      <input
        type="range"
        min={0}
        max={FORECAST_HOURS}
        step={1}
        value={hour}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Forecast hour"
        aria-valuetext={`T+${hour} hours, flood extent ${floodScaleForHour(hour).toFixed(2)}×`}
        className="w-full cursor-pointer accent-[var(--dl-blue-light)]"
      />

      {/* Tick marks + labels every 12h — px-[13px] offsets the native
          range input's thumb padding so 0h/72h sit on the track ends. */}
      <div aria-hidden="true" className="mt-0.5 flex justify-between px-[13px]">
        {FORECAST_TICKS.map((t) => (
          <span
            key={t}
            className={`flex h-4 flex-col items-center gap-0.5 text-[0.5625rem] font-medium ${
              t === hour ? "text-[var(--dl-blue-light)]" : "text-white/35"
            }`}
          >
            <span className="h-1 w-px bg-white/20" />
            {t}h
          </span>
        ))}
      </div>

      {/* Footer — extent factor readout. */}
      <div className="mt-1.5 flex items-center justify-between text-[0.625rem] font-medium text-white/50">
        <span>Flood extent ×{floodScaleForHour(hour).toFixed(2)}</span>
        <span>
          {hour === 0
            ? "River at normal level"
            : hour >= FORECAST_HOURS
              ? "Forecast window complete"
              : "Model prediction · simulated water level"}
        </span>
      </div>
    </div>
  );
}

export default TimeSliderControl;
