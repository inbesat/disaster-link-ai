"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/settings/map/page.tsx — UI/UX Phase 7 · Step 5.
//
// Map rendering preferences:
//   • visual layer toggles with mini-preview icons
//   • opacity sliders with live percentage readouts
//   • Metric / Imperial radio selector (aligns with MapUnits from lib)
//   • offline cache progress bar
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  Download,
  Landmark,
  Map as MapIcon,
  Route,
  Trash2,
  Waves,
  type LucideIcon,
} from "lucide-react";
import SettingsSection from "@/components/settings/SettingsSection";
import Toggle from "@/components/settings/Toggle";
import type { MapUnits } from "@/lib/settings/map-settings";
import { showToast } from "@/components/ui/Toast";

type LayerKey = "flood" | "shelters" | "roads";

type LayerRow = {
  key: LayerKey;
  label: string;
  hint: string;
  icon: LucideIcon;
  previewColor: string;
  defaultOpacity: number;
};

const LAYERS: LayerRow[] = [
  {
    key: "flood",
    label: "Flood",
    hint: "Projected inundation envelope",
    icon: Waves,
    previewColor: "#60a5fa",
    defaultOpacity: 45,
  },
  {
    key: "shelters",
    label: "Shelters",
    hint: "Active evacuation shelters",
    icon: Landmark,
    previewColor: "#34d399",
    defaultOpacity: 80,
  },
  {
    key: "roads",
    label: "Routes",
    hint: "NH / internal routes + closures",
    icon: Route,
    previewColor: "#fbbf24",
    defaultOpacity: 70,
  },
];

function OpacitySlider({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        aria-label={`${label} opacity`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-tertiary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${value}%, #1e293b ${value}%, #1e293b 100%)`,
        }}
      />
      <span className="w-11 shrink-0 text-right font-mono text-xs text-slate-300">
        {value}%
      </span>
    </div>
  );
}

export default function MapSettingsPage() {
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    flood: true,
    shelters: true,
    roads: true,
  });
  const [opacity, setOpacity] = useState<Record<LayerKey, number>>(
    () =>
      Object.fromEntries(LAYERS.map((l) => [l.key, l.defaultOpacity])) as Record<
        LayerKey,
        number
      >,
  );
  const [units, setUnits] = useState<MapUnits>("metric");
  const [cacheMB, setCacheMB] = useState(45);
  const CACHE_LIMIT_MB = 500;

  return (
    <div className="flex flex-col gap-6">
      <SettingsSection
        title="Map Defaults"
        description="Layer visibility, opacity and measurement units for every map view."
        icon={MapIcon}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.key}
                className="rounded-xl border border-border bg-secondary p-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      color: layer.previewColor,
                      borderColor: `${layer.previewColor}55`,
                      backgroundColor: `${layer.previewColor}14`,
                    }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-primary">{layer.label}</p>
                    <p className="truncate text-xs text-muted">{layer.hint}</p>
                  </div>
                  <Toggle
                    checked={visible[layer.key]}
                    onChange={(v) => setVisible((prev) => ({ ...prev, [layer.key]: v }))}
                    label={`${layer.label} visible`}
                  />
                </div>
                <div className="mt-4 border-t border-subtle pt-3">
                  <OpacitySlider
                    label={layer.label}
                    value={opacity[layer.key]}
                    onChange={(v) => setOpacity((prev) => ({ ...prev, [layer.key]: v }))}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Units"
        description="How distances, depths and elevations are reported to field teams."
        icon={Landmark}
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">Units</legend>
          {(
            [
              { value: "metric", label: "Metric", hint: "km · metres · °C" },
              { value: "imperial", label: "Imperial", hint: "mi · ft · °F" },
            ] as const
          ).map((option) => {
            const active = units === option.value;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                  active
                    ? "border-accent bg-accent/5"
                    : "border-border bg-secondary hover:border-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="units"
                  value={option.value}
                  checked={active}
                  onChange={() => setUnits(option.value)}
                  className="h-4 w-4 accent-[var(--accent-primary)]"
                />
                <span className="flex-1 text-sm font-semibold text-slate-100">
                  {option.label}
                </span>
                <span className="font-mono text-xs text-muted">{option.hint}</span>
              </label>
            );
          })}
        </fieldset>
      </SettingsSection>

      <SettingsSection
        title="Offline Map Cache"
        description="Pre-load basemap tiles &amp; hazard layers for low-connectivity zones."
        icon={Download}
      >
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-100">
              Patna &amp; Punpun corridor
            </span>
            <span className="font-mono text-xs text-slate-300">
              {cacheMB} MB / {CACHE_LIMIT_MB} MB
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-tertiary">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(cacheMB / CACHE_LIMIT_MB) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setCacheMB(0);
                showToast("info", {
                  title: "Cache cleared",
                  description: `${cacheMB} MB of offline tiles removed.`,
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-accent-danger hover:text-accent-danger"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Clear Cache
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
