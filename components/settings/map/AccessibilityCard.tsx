"use client";

// ---------------------------------------------------------------------
// components/settings/map/AccessibilityCard.tsx — Map & GIS (Phase 3 · Step 9).
//
// Visual accessibility toggles:
//   • Colorblind Mode (Protanopia / Deuteranopia) — replaces the standard
//     red/green severity indicators with blue/orange + stripes/dots.
//   • High Contrast Map UI — thickens road outlines and enlarges labels.
//   • Live preview thumbnail: orange a map marker flip from red/green to
//     blue/orange as you toggle.
// ---------------------------------------------------------------------

import { Contrast, Eye, Sun } from "lucide-react";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";

export default function AccessibilityCard() {
  const { settings, update } = useMapSettings();
  const accessibility = settings.accessibility;

  function setColorblindMode(enabled: boolean) {
    update({ accessibility: { ...accessibility, colorblindMode: enabled } });
  }

  function setHighContrast(enabled: boolean) {
    update({ accessibility: { ...accessibility, highContrast: enabled } });
  }

  const cb = accessibility.colorblindMode;

  return (
    <section
      data-settings-key="map-accessibility"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Contrast className="h-5 w-5 text-violet-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-violet-300/80">ACCESSIBILITY</p>
          <h2 className="mt-0.5 text-lg font-bold">Colorblind &amp; Contrast</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Adapt the map so every responder reads severity instantly — regardless
        of colour vision or screen conditions.
      </p>

      {/* Colorblind Mode toggle */}
      <div className="mt-5 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                cb ? "bg-orange-500/15" : "bg-violet-500/10"
              }`}
            >
              <Eye
                className={`h-4 w-4 ${cb ? "text-orange-300" : "text-violet-300"}`}
                aria-hidden
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Colorblind Mode
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Protanopia / Deuteranopia
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={cb}
            aria-label="Toggle colorblind mode"
            onClick={() => setColorblindMode(!cb)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              cb ? "bg-orange-500" : "bg-[#2c3f6d]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                cb ? "translate-x-[22px]" : "-translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Replaces the standard red/green severity indicators with highly
          distinguishable patterns — stripes/dots — and a{" "}
          <span className="font-semibold text-orange-300">blue</span> /{" "}
          <span className="font-semibold text-orange-300">orange</span> color
          palette that is readable even with a red-green colour-vision
          deficiency.
        </p>
      </div>

      {/* High Contrast toggle */}
      <div className="mt-4 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                settings.accessibility.highContrast
                  ? "bg-yellow-500/15"
                  : "bg-violet-500/10"
              }`}
            >
              <Sun
                className={`h-4 w-4 ${
                  settings.accessibility.highContrast
                    ? "text-yellow-300"
                    : "text-violet-300"
                }`}
                aria-hidden
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                High Contrast Map UI
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Better legibility in direct sunlight
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.accessibility.highContrast}
            aria-label="Toggle high contrast map UI"
            onClick={() => setHighContrast(!settings.accessibility.highContrast)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              settings.accessibility.highContrast ? "bg-yellow-500" : "bg-[#2c3f6d]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                settings.accessibility.highContrast
                  ? "translate-x-[22px]"
                  : "-translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Thickens road outlines and increases the font size of map labels so
          they stand out against flooded terrain and dense shading.
        </p>
      </div>

      {/* Live preview thumbnail */}
      <PreviewThumbnail
        colorblind={cb}
        highContrast={settings.accessibility.highContrast}
      />
    </section>
  );
}

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function PreviewThumbnail({
  colorblind,
  highContrast,
}: {
  colorblind: boolean;
  highContrast: boolean;
}) {
  // Palette morph: standard red/green → colorblind blue/orange.
  const safeBg = colorblind ? "#1d4ed8" : "#16a34a";
  const safeText = colorblind ? "blue" : "green";
  const dangerBg = colorblind ? "#ea580c" : "#dc2626";
  const dangerText = colorblind ? "orange" : "red";

  return (
    <div className="mt-5 rounded-md border border-panel-border bg-surface-muted/40 p-4">
      <p className="text-[11px] font-semibold tracking-wide text-slate-400">
        LIVE PREVIEW
      </p>

      {/* Stylized map thumbnail */}
      <div
        className="mt-2.5 relative h-36 overflow-hidden rounded-md border border-panel-borderHover bg-gradient-to-br from-slate-800 to-slate-950"
        aria-label={`Map preview: ${colorblind ? "colorblind" : "standard"} palette`}
      >
        {/* Roads (thicken in high contrast) */}
        <div
          className="absolute left-0 top-1/2 h-full w-full -rotate-6 bg-yellow-500/60"
          style={{ width: "110%", height: highContrast ? 7 : 3, left: "-5%" }}
        />
        <div
          className="absolute left-0 top-1/2 h-full w-full rotate-12 bg-yellow-500/60"
          style={{ width: "110%", height: highContrast ? 7 : 3, left: "-5%" }}
        />

        {/* Sample safety annotations / severity zones */}
        <div
          className="absolute left-4 top-4 h-10 w-16 rounded-sm"
          style={{
            backgroundColor: safeBg,
            opacity: 0.55,
            backgroundImage: colorblind
              ? "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.35) 4px, rgba(255,255,255,0.35) 6px)"
              : undefined,
          }}
        >
          {colorblind && (
            <span className="absolute left-1 top-1 text-[9px] font-bold text-white">
              SAFE
            </span>
          )}
        </div>
        <div
          className="absolute right-4 bottom-4 h-10 w-16 rounded-sm"
          style={{
            backgroundColor: dangerBg,
            opacity: 0.65,
            backgroundImage: colorblind
              ? "radial-gradient(circle, rgba(255,255,255,0.45) 1.5px, transparent 1.5px)"
              : undefined,
            backgroundSize: colorblind ? "7px 7px" : undefined,
          }}
        >
          {colorblind && (
            <span className="absolute right-1 bottom-1 text-[9px] font-bold text-white">
              EVAC
            </span>
          )}
        </div>

        {/* Marker pair */}
        <div className="absolute inset-0 flex items-center justify-center gap-8">
          <Marker color={safeBg} label="Safe" colorblind={colorblind} />
          <Marker color={dangerBg} label="Evac" colorblind={colorblind} />
        </div>

        <span className="absolute bottom-1 right-2 rounded bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
          {colorblind ? "blue / orange" : "red / green"}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500">
        <span
          className="inline-flex items-center gap-1.5"
          style={{ color: safeText === "blue" ? "#3b82f6" : "#22c55e" }}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full ${colorblind ? "bg-blue-500" : "bg-green-500"}`}
          />
          Safe = {safeText}
        </span>
        <span
          className="inline-flex items-center gap-1.5"
          style={{ color: dangerText === "orange" ? "#fb923c" : "#ef4444" }}
        >
          <span
            className={`inline-block h-3 w-3 rounded-full ${colorblind ? "bg-orange-500" : "bg-red-500"}`}
          />
          Evacuate = {dangerText}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block h-3 w-3 ${colorblind ? "bg-orange-500" : "bg-red-500"}`}
            style={{
              backgroundImage: colorblind
                ? "repeating-linear-gradient(90deg, orange, orange 3px, red 3px)"
                : "repeating-linear-gradient(90deg, red, red 4px)",
            }}
          />
          {colorblind ? "Stripes / dots pattern" : "Solid colour"}
        </span>
      </div>
    </div>
  );
}

function Marker({
  color,
  label,
  colorblind,
}: {
  color: string;
  label: string;
  colorblind: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="relative h-6 w-6 rounded-full border-2 border-white/90 shadow-lg"
        style={{
          backgroundColor: color,
          backgroundImage: colorblind
            ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.5), rgba(255,255,255,0.5) 3px, transparent 3px, transparent 6px)"
            : undefined,
        }}
      >
        <span className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent"
          style={{ borderTopColor: color }}
        />
      </div>
      <span className="rounded-sm bg-black/70 px-1.5 text-eoc-tiny font-semibold text-white">
        {label}
      </span>
    </div>
  );
}