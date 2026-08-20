"use client";

// ---------------------------------------------------------------------
// components/demo/fm/FmJudgesPanel.tsx — Phase 9 · Judges' FM Broadcast
// View.
//
// The \"if this were live…\" panel for the pitch:
//   • impact copy with the reach numbers for the selected district,
//   • animated \"Stations reached: 0 → N\" counter over 3 s,
//   • a mini map whose station dots pulse green as they come online,
//   • an equalizer waveform + playable demo alert tone (Phase 9 audio
//     samples from /public/demo-audio/).
//
// Pure presentation — reads the completed run from the page and animates.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapGl, Marker } from "react-map-gl/maplibre";
import { AudioLines, Eye, RadioTower, Users } from "lucide-react";
import { judgesSnapshot } from "@/lib/fm/simulation";
import type { RunCompletePayload, SimDisasterType } from "./FmBroadcastSimulator";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** demo-audio sample per disaster type + language (hi/en). */
const AUDIO_SAMPLES: Record<SimDisasterType, { hi: string; en: string }> = {
  flood: { hi: "/demo-audio/flood_hi.wav", en: "/demo-audio/flood_en.wav" },
  cyclone: { hi: "/demo-audio/cyclone_hi.wav", en: "/demo-audio/cyclone_en.wav" },
  earthquake: { hi: "/demo-audio/earthquake_hi.wav", en: "/demo-audio/flood_en.wav" },
  heatwave: { hi: "/demo-audio/flood_hi.wav", en: "/demo-audio/flood_en.wav" },
};

const fmt = (n: number) => n.toLocaleString("en-IN");

export default function FmJudgesPanel({
  districtId,
  disasterType,
  run,
  runKey,
}: {
  districtId: string;
  disasterType: SimDisasterType;
  /** Completed run (null before the first simulation). */
  run: RunCompletePayload | null;
  /** Bumped on every completed run — re-triggers the animations. */
  runKey: number;
}) {
  const snap = judgesSnapshot(districtId);
  const [language, setLanguage] = useState<"hi" | "en">("hi");
  const [counter, setCounter] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stationCount = snap?.stationCount ?? 0;

  // Animate the station counter 0 → N over 3 s whenever a run completes.
  useEffect(() => {
    if (runKey === 0) return;
    const target = run?.stations.length ?? stationCount;
    if (target === 0) return;
    const duration = 3000;
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounter(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setCounter(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [runKey, run, stationCount]);

  const audioSrc = useMemo(() => AUDIO_SAMPLES[disasterType][language], [disasterType, language]);
  const reachedStations = run?.stations ?? [];
  const pulseAll = runKey > 0;

  if (!snap) return null;

  return (
    <div className="rounded-xl border border-panel-border bg-panel p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
          <Eye className="h-4 w-4 text-emerald-400" />
          Judges&apos; FM Broadcast View
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {runKey > 0 ? "Live simulation" : "Simulated"}
        </span>
      </div>

      {/* Impact copy */}
      <p className="text-sm leading-relaxed text-slate-300">
        If this were live,{" "}
        <span className="font-bold text-emerald-300">{stationCount} FM stations</span> in{" "}
        <span className="font-bold text-foreground">{snap.district.name} district</span>{" "}
        would now be broadcasting this alert to{" "}
        <span className="font-bold text-emerald-300">{fmt(snap.citizens)} citizens</span>.
      </p>

      {/* Animated counter */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-panel-border bg-primary p-3">
          <p className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-wider text-slate-500">
            <RadioTower className="h-3 w-3" /> Stations reached
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-emerald-300">
            {counter}
            <span className="text-base text-slate-500"> / {stationCount}</span>
          </p>
        </div>
        <div className="rounded-lg border border-panel-border bg-primary p-3">
          <p className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-wider text-slate-500">
            <Users className="h-3 w-3" /> Citizens reached
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-sky-300">{fmt(snap.citizens)}</p>
        </div>
      </div>

      {/* Mini map with pulsing station dots */}
      <div className="relative mt-4 h-[180px] overflow-hidden rounded-lg border border-panel-border">
        <MiniStationMap
          district={{ lat: snap.district.lat, lng: snap.district.lng }}
          stations={reachedStations}
          pulse={pulseAll}
        />
      </div>

      {/* Waveform + demo audio */}
      <div className="mt-4 rounded-lg border border-panel-border bg-primary p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[0.625rem] uppercase tracking-wider text-slate-500">
            <AudioLines className="h-3 w-3" /> AI voice preview
          </p>
          <div className="flex gap-1">
            {(["hi", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded px-2 py-0.5 text-[0.625rem] font-bold uppercase transition ${
                  language === lang
                    ? "bg-amber-500/20 text-amber-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <Equalizer active={waveActive} />

        <div className="mt-3 flex items-center gap-2">
          <audio
            ref={(el) => {
              audioRef.current = el;
            }}
            src={audioSrc}
            preload="none"
            onPlay={() => setWaveActive(true)}
            onPause={() => setWaveActive(false)}
            onEnded={() => setWaveActive(false)}
            controls
            className="h-9 w-full"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
        <p className="mt-2 text-[0.625rem] text-slate-600">
          Demo alert tone (placeholder voice) · real AI voices generated via /api/tts/generate
        </p>
      </div>

      <p className="mt-4 border-t border-panel-border pt-3 text-[0.6875rem] leading-relaxed text-slate-500">
        Detection → broadcast in <span className="font-bold text-amber-300">~{snap.latencySeconds}s</span>.
        CAP feed + AI audio pushed to every station within seconds — even drivers with no
        smartphone see the alert on their car radio.
      </p>
    </div>
  );
}

/** Compact map showing the district + pulsing station dots as they come online. */
function MiniStationMap({
  district,
  stations,
  pulse,
}: {
  district: { lat: number; lng: number };
  stations: Array<{ name: string; lat: number | null; lng: number | null; type: string }>;
  pulse: boolean;
}) {
  return (
    <MapGl
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      initialViewState={{
        longitude: district.lng,
        latitude: district.lat,
        zoom: 7,
      }}
      style={{ width: "100%", height: "100%" }}
      interactive={false}
    >
      {/* District epicentre */}
      <Marker longitude={district.lng} latitude={district.lat} anchor="center">
        <span className="relative block">
          <span className="absolute -inset-2 animate-ping rounded-full bg-red-500/40" />
          <span className="relative block h-3 w-3 rounded-full border-2 border-white bg-red-500" />
        </span>
      </Marker>

      {/* Station dots — pulse green when the run confirms them */}
      {stations.map((s) =>
        s.lat !== null && s.lng !== null ? (
          <Marker key={s.name} longitude={s.lng} latitude={s.lat} anchor="center">
            <span className="relative block">
              {pulse && (
                <span className="absolute -inset-1.5 animate-ping rounded-full bg-emerald-500/50" />
              )}
              <span
                className={`relative block h-2.5 w-2.5 rounded-full border border-white shadow ${
                  pulse ? "bg-emerald-400" : "bg-slate-500"
                }`}
                title={s.name}
              />
            </span>
          </Marker>
        ) : null,
      )}
    </MapGl>
  );
}

/** CSS-animated equalizer bars — deterministic, no audio decoding needed. */
function Equalizer({ active }: { active: boolean }) {
  const bars = [0.5, 0.9, 0.6, 1.0, 0.7, 0.85, 0.55, 0.95, 0.65, 0.8, 0.5, 0.9];
  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {bars.map((height, i) => (
        <span
          key={i}
          className={`flex-1 rounded-t-sm bg-gradient-to-t from-emerald-500/60 to-emerald-300 ${
            active ? "eq-bar" : ""
          }`}
          style={
            active
              ? ({ animationDelay: `${i * 90}ms`, "--eq-h": `${height * 100}%` } as React.CSSProperties)
              : { height: `${height * 32}%` }
          }
        />
      ))}
      <style>{`
        .eq-bar {
          height: var(--eq-h);
          animation: eq-bounce 0.7s ease-in-out infinite alternate;
        }
        @keyframes eq-bounce {
          from { height: 8%; }
          to { height: var(--eq-h); }
        }
      `}</style>
    </div>
  );
}
