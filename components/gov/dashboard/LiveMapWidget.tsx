"use client";

import { useState } from "react";
import { Compass, Layers, Minus, Plus } from "lucide-react";

// ---------------------------------------------------------------------
// components/gov/dashboard/LiveMapWidget.tsx — Phase 7 · Step 3.
//
// The 2×2 tactical map canvas of the Command Center. A pure CSS/SVG
// placeholder for now — the header chip marks it as the MapLibre GL
// injection target (Phase 7 · Step 7 will swap the SVG canvas for a real
// MapLibre instance). The decorative zoom controls scale the SVG canvas
// so commanders get the "live ops map" feel before the real tiles load.
// ---------------------------------------------------------------------

const ZOOM_LEVELS = [1, 1.25, 1.6] as const;

/** HTML-overlay live markers — % coordinates over the SVG canvas. */
const LIVE_MARKERS = [
  { label: "SOS · Sector 4", x: "34%", y: "30%", tone: "bg-severity-red-400" },
  { label: "Responder 12", x: "56%", y: "52%", tone: "bg-[var(--dl-blue-light)]" },
  { label: "Shelter · KHS", x: "72%", y: "38%", tone: "bg-severity-green-400" },
  { label: "Road closed", x: "46%", y: "72%", tone: "bg-severity-amber-400" },
] as const;

export function LiveMapWidget() {
  const [zoomIdx, setZoomIdx] = useState(0);
  const zoom = ZOOM_LEVELS[zoomIdx];

  return (
    <section className="flex h-full min-h-[440px] flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-white/20">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Layers aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
          <h2 className="eoc-label text-white">Live Operations Map</h2>
          <span className="rounded-full border border-[var(--dl-blue-light)]/30 bg-[var(--dl-blue)]/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--dl-blue-light)]">
            MAPLIBRE READY
          </span>
        </div>

        {/* Decorative zoom controls */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 p-0.5">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoomIdx === 0}
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="eoc-label w-9 text-center text-[var(--dl-text-muted)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoomIdx === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="relative flex-1 overflow-hidden p-2">
        <svg
          viewBox="0 0 640 420"
          role="img"
          aria-label="Tactical map placeholder — flood zones, river and shelters over the district grid"
          className="h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
        >
          {/* District base */}
          <rect width="640" height="420" fill="#0d1526" />
          <rect
            width="640"
            height="420"
            fill="url(#gov-map-grid)"
            opacity="0.6"
          />
          <defs>
            <pattern id="gov-map-grid" width="80" height="70" patternUnits="userSpaceOnUse">
              <path d="M80 0H0V70" fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Ganga river — broad band sweeping through the district */}
          <path
            d="M-20 340 C 120 300, 200 260, 300 240 C 420 216, 520 250, 660 190"
            fill="none"
            stroke="#16324f"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M-20 340 C 120 300, 200 260, 300 240 C 420 216, 520 250, 660 190"
            fill="none"
            stroke="#1f4e7a"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="14 10"
            opacity="0.8"
          />

          {/* NH-31 trunk road */}
          <path
            d="M-20 150 C 140 160, 320 140, 480 170 L 660 120"
            fill="none"
            stroke="#8a6d1d"
            strokeWidth="7"
            strokeDasharray="16 8"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Flood hazard zones */}
          <polygon points="90,60 230,48 260,150 120,170" fill="#ef4444" fillOpacity="0.12" stroke="#ef4444" strokeOpacity="0.45" strokeWidth="1.5" />
          <polygon points="380,300 520,288 560,380 400,398" fill="#ef4444" fillOpacity="0.10" stroke="#ef4444" strokeOpacity="0.35" strokeWidth="1.5" />

          {/* Shelters */}
          <rect x="468" y="130" width="12" height="12" fill="#10b981" opacity="0.9" />
          <rect x="196" y="300" width="12" height="12" fill="#10b981" opacity="0.9" />

          {/* Compass rose */}
          <g transform="translate(596, 52)" opacity="0.9">
            <circle r="22" fill="#0a0f1a" stroke="#ffffff" strokeOpacity="0.25" />
            <path d="M0 -16 L5 6 L0 2 L-5 6 Z" fill="#f87171" />
            <path d="M0 16 L5 -6 L0 -2 L-5 -6 Z" fill="#e2e8f0" />
            <text y="-28" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">N</text>
          </g>
        </svg>

        {/* Live overlay markers (HTML — animate-ping works on these) */}
        {LIVE_MARKERS.map((m) => (
          <div
            key={m.label}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: m.x, top: m.y }}
          >
            <span className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${m.tone} opacity-60`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${m.tone}`} />
            </span>
            <span className="absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white/90">
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 px-5 py-3">
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--dl-text-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm bg-severity-red-400/70" /> Flood zone
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--dl-text-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm bg-severity-amber-400/70" /> Road closed
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--dl-text-muted)]">
          <span className="h-2.5 w-2.5 rounded-sm bg-severity-green-400/70" /> Shelter
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-[var(--dl-text-muted)]">
          <Compass aria-hidden="true" className="h-3 w-3 text-[var(--dl-blue-light)]" /> MapLibre GL target
        </span>
      </footer>
    </section>
  );
}

export default LiveMapWidget;
