"use client";

// ---------------------------------------------------------------------
// components/settings/map/DefaultViewCard.tsx — Map & GIS (Phase 3 · Step 2).
//
// "Default Map View & Base Style Configurator" for /settings/map:
//   • Base Map Style radio-card selector — Satellite, Terrain, Street,
//     Tactical Dark (default) — each with a tiny thumbnail preview.
//   • Default Zoom Level slider (1–20, default 12) with Global / District /
//     Street Level step labels.
//   • Home Coordinates lat/lng inputs.
//   • "Set to Current Location" — navigator.geolocation auto-fills the
//     coordinates (graceful errors fall back to the demo district HQ).
//
// Fully controlled via useMapSettings — every change re-renders the
// command-center map immediately.
// ---------------------------------------------------------------------

import { useState } from "react";
import {
  Crosshair,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  Satellite,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type { MapBasemapStyle } from "@/lib/settings/map-settings";

const ZOOM_MIN = 1;
const ZOOM_MAX = 20;
const ZOOM_DEFAULT = 12;

const BASEMAP_STYLES: {
  value: MapBasemapStyle;
  label: string;
  description: string;
  thumb: JSX.Element;
}[] = [
  {
    value: "satellite",
    label: "Satellite",
    description: "High-res aerial imagery",
    thumb: (
      <div className="relative h-full w-full overflow-hidden rounded-sm bg-gradient-to-br from-emerald-700 via-teal-800 to-cyan-900">
        <div className="absolute left-1 top-1 h-2 w-4 rounded-[2px] bg-emerald-400/60" />
        <div className="absolute bottom-1 right-1 h-1 w-3 rounded-full bg-cyan-300/50" />
      </div>
    ),
  },
  {
    value: "terrain",
    label: "Terrain",
    description: "Elevation & contours",
    thumb: (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-lime-800 via-emerald-700 to-slate-700">
        <div className="absolute right-0 top-0 h-6 w-6 rounded-tl-[80%] bg-amber-700/70" />
        <div className="absolute bottom-0 left-2 h-4 w-8 rounded-t-full bg-lime-600/60" />
      </div>
    ),
  },
  {
    value: "street",
    label: "Street",
    description: "Roads & named places",
    thumb: (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-sky-100 to-slate-200">
        <div className="absolute left-0 top-2 h-1 w-12 rotate-[-12deg] rounded-full bg-slate-400" />
        <div className="absolute right-1 top-0 h-10 w-1 rotate-3 rounded-full bg-slate-400" />
        <div className="absolute bottom-1.5 left-2 h-1.5 w-3 rounded-full bg-amber-400" />
      </div>
    ),
  },
  {
    value: "tactical_dark",
    label: "Tactical Dark",
    description: "Night-ops default",
    thumb: (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950">
        <div className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#22d3ee]" />
        <div className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_6px_#34d399]" />
      </div>
    ),
  },
];

/** Demo-center fallback if the browser refuses geolocation. */
const DEMO_FALLBACK = { lat: 25.5941, lng: 85.1376 }; // Patna

export default function DefaultViewCard() {
  const { settings, update } = useMapSettings();
  const view = settings.defaultView;
  const [geoState, setGeoState] = useState<"idle" | "locating" | "done">("idle");

  function setBasemap(basemapStyle: MapBasemapStyle) {
    update({ display: { ...settings.display, basemapStyle } });
  }

  function setZoom(next: number) {
    const clamped = Math.min(Math.max(next, ZOOM_MIN), ZOOM_MAX);
    update({ defaultView: { ...view, zoom: clamped } });
  }

  function setLat(lat: number) {
    const clamped = Math.min(Math.max(lat, -90), 90);
    update({ defaultView: { ...view, center: { ...view.center, lat: clamped } } });
  }

  function setLng(lng: number) {
    const clamped = Math.min(Math.max(lng, -180), 180);
    update({ defaultView: { ...view, center: { ...view.center, lng: clamped } } });
  }

  function applyCoordinates(lat: number, lng: number) {
    setLat(lat);
    setLng(lng);
    setGeoState("done");
    toast.success("Home coordinates set to your current live location.");
  }

  function fallbackToDemo() {
    setLat(DEMO_FALLBACK.lat);
    setLng(DEMO_FALLBACK.lng);
    setGeoState("done");
    toast(
      <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-[#1c2740] px-3 py-2 text-xs text-amber-200">
        <LocateFixed className="h-4 w-4" aria-hidden />
        Location unavailable — set Home to Demo District HQ (Patna).
      </div>,
      { duration: 4000 },
    );
  }

  function handleSetCurrentLocation() {
    setGeoState("locating");

    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoordinates(
            Number(pos.coords.latitude.toFixed(4)),
            Number(pos.coords.longitude.toFixed(4)),
          );
        },
        () => fallbackToDemo(),
        { timeout: 8000, maximumAge: 30000 },
      );
    } else {
      fallbackToDemo();
    }
  }

  const zoomPercent = ((view.zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100;
  const zoomBand =
    view.zoom <= 5 ? "Global" : view.zoom <= 13 ? "District" : "Street Level";

  return (
    <section
      data-settings-key="map-default"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <Crosshair className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">LAYOUT & STARTUP</p>
          <h2 className="mt-0.5 text-lg font-bold">Default Map View</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Configure the style, zoom and anchor point your tactical map opens on
        every session.
      </p>

      {/* Base Map Style radio-cards */}
      <div className="mt-5">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <MapIcon className="h-3.5 w-3.5" aria-hidden />
          BASE MAP STYLE
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BASEMAP_STYLES.map((style) => {
            const active = settings.display.basemapStyle === style.value;
            return (
              <button
                key={style.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setBasemap(style.value)}
                className={`group rounded-md border p-2 text-left transition ${
                  active
                    ? "border-emerald-400/70 bg-emerald-500/10"
                    : "border-[#1c2740] bg-surface-muted/40 hover:border-emerald-400/40"
                }`}
              >
                <div className="h-12 w-full overflow-hidden rounded-sm">
                  {style.thumb}
                </div>
                <p
                  className={`mt-1.5 text-xs font-semibold ${
                    active ? "text-emerald-200" : "text-slate-300"
                  }`}
                >
                  {style.label}
                </p>
                <p className="text-[9px] leading-tight text-slate-500">
                  {style.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Default Zoom Level */}
      <div className="mt-5 rounded-md border border-[#1c2740] bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Navigation className="h-4 w-4 text-emerald-300" aria-hidden />
            Default Zoom Level
          </p>
          <span className="rounded-md bg-[#0a0f1d] px-2 py-1 font-mono text-xs text-emerald-300">
            {view.zoom} · {zoomBand}
          </span>
        </div>

        <input
          type="range"
          aria-label="Default zoom level"
          aria-valuetext={`${view.zoom} — ${zoomBand}`}
          min={ZOOM_MIN}
          max={ZOOM_MAX}
          step={1}
          value={view.zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="slider-rail mt-3 w-full cursor-pointer appearance-none rounded-full bg-transparent"
          style={{
            background: `linear-gradient(to right, #34d399 ${zoomPercent}%, #2c3f6d ${zoomPercent}%)`,
          }}
        />

        <div className="mt-2 flex justify-between text-[10px] text-slate-600">
          <span>1 · Global</span>
          <button
            type="button"
            onClick={() => setZoom(ZOOM_DEFAULT)}
            className="font-semibold text-emerald-400/80 underline-offset-2 transition hover:text-emerald-300 hover:underline"
          >
            12 · District (default)
          </button>
          <span>20 · Street Level</span>
        </div>
      </div>

      {/* Home Coordinates + geolocate */}
      <div className="mt-5 rounded-md border border-[#1c2740] bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <LocateFixed className="h-4 w-4 text-emerald-300" aria-hidden />
            Home Coordinates
          </p>
          <button
            type="button"
            onClick={handleSetCurrentLocation}
            disabled={geoState === "locating"}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {geoState === "locating" ? (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-300/40 border-t-emerald-300"
                aria-hidden
              />
            ) : (
              <LocateFixed className="h-3.5 w-3.5" aria-hidden />
            )}
            {geoState === "locating" ? "Locating…" : "Set to Current Location"}
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="home-lat"
              className="block text-[11px] font-semibold text-slate-400"
            >
              Latitude
            </label>
            <input
              id="home-lat"
              type="number"
              step={0.0001}
              min={-90}
              max={90}
              value={Number(view.center.lat.toFixed(4))}
              onChange={(e) => setLat(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-[#2c3f6d] bg-[#0a0f1d] px-3 py-2 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            />
          </div>
          <div>
            <label
              htmlFor="home-lng"
              className="block text-[11px] font-semibold text-slate-400"
            >
              Longitude
            </label>
            <input
              id="home-lng"
              type="number"
              step={0.0001}
              min={-180}
              max={180}
              value={Number(view.center.lng.toFixed(4))}
              onChange={(e) => setLng(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-[#2c3f6d] bg-[#0a0f1d] px-3 py-2 font-mono text-sm text-slate-100 outline-none transition focus:border-emerald-400"
            />
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          <Satellite className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Used as the map&apos;s anchor each time the command center loads.
        </p>
      </div>
    </section>
  );
}