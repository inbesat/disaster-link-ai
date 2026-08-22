"use client";

// ---------------------------------------------------------------------
// components/settings/org/ThresholdCalibrationCard.tsx — Organization (Phase 5 · Step 3).
//
// Flood Threshold Calibration for a selected operational district.
//   • 24h Rainfall Alert Marks via range sliders:
//       – Warning (Amber)  default > 100 mm/24h
//       – Critical (Red)   default > 200 mm/24h
//   • River Level Danger Marks (metres) via number inputs.
//
// Helper text: these local thresholds calibrate the AI Prediction Engine to
// account for regional topography.
// ---------------------------------------------------------------------

import { useState } from "react";
import { CloudRain, Gauge, MapPin, Waves } from "lucide-react";
import { useOrgSettings } from "@/lib/org-settings-mock";

const RAIN_MAX = 400;

const DEFAULT_THRESHOLDS = {
  warningRain: 100,
  criticalRain: 200,
  warningRiver: 2.5,
  criticalRiver: 3.8,
};

export default function ThresholdCalibrationCard() {
  const { settings, updateThresholds } = useOrgSettings();
  const [districtId, setDistrictId] = useState(settings.districts[0]?.id ?? "");
  const options = settings.districts;
  const district = options.find((d) => d.id === districtId) ?? options[0];

  const current = settings.thresholds[district?.id ?? ""] ?? DEFAULT_THRESHOLDS;
  const warningRain = current.warningRain;
  const criticalRain = current.criticalRain;
  const warningRiver = current.warningRiver;
  const criticalRiver = current.criticalRiver;

  const rainBandOk = criticalRain > warningRain;
  const riverOk = criticalRiver > warningRiver;

  const warningPct = toPercent(warningRain);
  const criticalPct = toPercent(criticalRain);

  return (
    <section
      data-settings-key="org-threshold-calibration"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <Gauge className="h-5 w-5 text-red-300" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-red-300/80">CALIBRATION</p>
            <h2 className="mt-0.5 text-lg font-bold">
              Flood Threshold Calibration
            </h2>
          </div>
        </div>

        {/* District selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="calibration-district"
            className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
          >
            District
          </label>
          <select
            id="calibration-district"
            value={district ? district.id : ""}
            onChange={(e) => setDistrictId(e.target.value)}
            className="rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2 text-sm font-semibold text-slate-200 outline-none focus:border-red-400/60"
          >
            {options.map((d) => (
              <option key={d.id} value={d.id} className="bg-[#0a0f1a]">
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        {district ? `${district.name}, ${district.state} — applying local marks to` : "Applying local marks to"}{" "}the AI Prediction Engine.
      </p>

      <p className="mt-4 rounded-md border border-panel-border bg-surface-muted/40 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
        These local thresholds calibrate the AI Prediction Engine to account
        for regional topography.
      </p>

      {/* ---- 24h Rainfall Alert Marks ---- */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/10">
            <CloudRain className="h-4 w-4 text-sky-300" aria-hidden />
          </div>
          <h3 className="text-sm font-bold text-slate-200">
            24h Rainfall Alert Marks
          </h3>
        </div>

        {/* Risk gradient band with slider markers */}
        <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-red-500 to-red-700" />
          <BandMarker left={`${warningPct}%`} className="bg-amber-200 ring-amber-300" />
          <BandMarker left={`${criticalPct}%`} className="bg-white ring-white" />
        </div>
        <div className="mt-1 flex justify-between text-eoc-tiny font-semibold uppercase tracking-wider text-slate-500">
          <span>0 mm</span>
          <span className="text-amber-300/90">Warning ›</span>
          <span className="text-red-300/90">Critical ›</span>
          <span>{RAIN_MAX} mm</span>
        </div>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <SliderField
            id="warning-rain"
            label="Warning Mark (Amber)"
            value={warningRain}
            min={0}
            max={RAIN_MAX}
            step={5}
            onChange={(v) => district && updateThresholds(district.id, { warningRain: v })}
            accent="amber"
            display={`> ${warningRain} mm/24h`}
          />
          <SliderField
            id="critical-rain"
            label="Critical Mark (Red)"
            value={criticalRain}
            min={0}
            max={RAIN_MAX}
            step={5}
            onChange={(v) => district && updateThresholds(district.id, { criticalRain: v })}
            accent="red"
            display={`> ${criticalRain} mm/24h`}
          />
        </div>

        <p
          className={`mt-2 text-[11px] font-semibold ${
            rainBandOk ? "text-emerald-400" : "text-red-300"
          }`}
        >
          {rainBandOk
            ? "Band valid — alerts escalate from Warning to Critical."
            : "Warning mark must be below the Critical mark."}
        </p>
      </div>

      <div className="my-6 h-px bg-[#1c2740]" />

      {/* ---- River Level Danger Marks ---- */}
      <div>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/10">
            <Waves className="h-4 w-4 text-cyan-300" aria-hidden />
          </div>
          <h3 className="text-sm font-bold text-slate-200">
            River Danger Marks
          </h3>
          <span className="rounded-full border border-panel-border bg-surface-muted/40 px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wider text-slate-500">
            metres
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Gauge level at which riverine flooding becomes a hazard for{" "}
          {district ? district.name : "this"} catchment areas.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <NumberField
            id="warning-river"
            label="Warning Level"
            value={warningRiver}
            onChange={(v) => district && updateThresholds(district.id, { warningRiver: clamp(v, 0, 10) })}
            step={0.1}
            accent="amber"
            unit="m"
          />
          <NumberField
            id="critical-river"
            label="Critical Level"
            value={criticalRiver}
            onChange={(v) => district && updateThresholds(district.id, { criticalRiver: clamp(v, 0, 10) })}
            step={0.1}
            accent="red"
            unit="m"
          />
        </div>

<p
          className={`mt-2 text-[11px] font-semibold ${
            riverOk ? "text-emerald-400" : "text-red-300"
          }`}
        >
          {riverOk
            ? "River escalation ladder is ordered correctly."
            : "Critical level must be above the warning level."}
        </p>
      </div>
    </section>
  );
}

function toPercent(rain: number): number {
  return Math.min(Math.max((rain / RAIN_MAX) * 100, 2), 98);
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(Math.max(v, min), max);
}

function BandMarker({
  left,
  className,
}: {
  left: string;
  className: string;
}) {
  return (
    <span
      aria-hidden
      className={`absolute top-1/2 z-10 h-5 w-1 -translate-y-1/2 rounded-full ring-2 ${className}`}
      style={{ left }}
    />
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  accent,
  display,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: "amber" | "red";
  display: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className={`text-sm font-semibold ${
            accent === "amber" ? "text-amber-300" : "text-red-300"
          }`}
        >
          {label}
        </label>
        <span className="shrink-0 rounded bg-surface-muted px-2 py-0.5 font-mono text-xs font-semibold text-slate-200">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-2.5 w-full ${
          accent === "amber" ? "accent-amber-500" : "accent-red-500"
        }`}
      />
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  step,
  accent,
  unit,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  accent: "amber" | "red";
  unit: string;
}) {
  return (
    <label className="block">
      <span
        className={`text-[11px] font-bold uppercase tracking-wider ${
          accent === "amber" ? "text-amber-300" : "text-red-300"
        }`}
      >
        {label}
      </span>
      <div className="mt-2 flex items-center gap-2">
        <input
          id={id}
          type="number"
          min={0}
          max={10}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.valueAsNumber)}
          className={`w-full rounded-md border bg-[#0a0f1a] px-3 py-2 font-mono text-sm text-slate-200 outline-none transition focus:border-red-400/60 ${
            accent === "amber" ? "border-amber-400/50" : "border-red-400/50"
          }`}
        />
        <span className="text-xs font-semibold text-slate-500">{unit}</span>
      </div>
    </label>
  );
}