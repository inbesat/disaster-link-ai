"use client";

// ---------------------------------------------------------------------
// components/demo/fm/FmBroadcastSimulator.tsx — Phase 9 · FM Broadcast
// Simulator.
//
// A judge-facing, 100%-mocked broadcast rehearsal:
//   • map of India with clickable district markers,
//   • disaster-type picker (flood / cyclone / earthquake / heatwave),
//   • "Simulate Broadcast" runs the animated pipeline from
//     lib/fm/simulation.ts — detecting stations → AI voice → CAP push
//     per station → RDS scrolling text → all stations confirmed.
//
// Lifecycle: the page passes a monotonically increasing `runId`; each
// new value starts a fresh animation. Changing the district or disaster
// type resets the pipeline. Nothing is ever contacted — the station list
// comes from MOCK_FM_STATIONS and the animation is a local state machine.
// On completion the caller receives the reached stations so the judges'
// panel can animate its counter/dots.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapGl, Marker, NavigationControl } from "react-map-gl/maplibre";
import {
  AudioLines,
  CheckCircle2,
  Loader2,
  MapPin,
  Radio,
  RadioTower,
  ScrollText,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  buildSimulationPipeline,
  SIMULATOR_DISTRICTS,
  simulatorStationsFor,
  type SimulationStage,
} from "@/lib/fm/simulation";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export type SimDisasterType = "flood" | "cyclone" | "earthquake" | "heatwave";

const DISASTER_TYPES: SimDisasterType[] = ["flood", "cyclone", "earthquake", "heatwave"];

const DISASTER_ICONS: Record<SimDisasterType, string> = {
  flood: "🌊",
  cyclone: "🌀",
  earthquake: "🛑",
  heatwave: "☀️",
};

export interface RunCompletePayload {
  districtId: string;
  disasterType: SimDisasterType;
  stations: Array<{
    name: string;
    frequency: string;
    type: string;
    rdsEnabled: boolean;
    lat: number | null;
    lng: number | null;
  }>;
}

export default function FmBroadcastSimulator({
  districtId,
  disasterType,
  runId,
  onStartRun,
  onDistrictChange,
  onDisasterTypeChange,
  onRunComplete,
}: {
  districtId: string;
  disasterType: SimDisasterType;
  /** Increment to start a new simulation run. */
  runId: number;
  onStartRun: () => void;
  onDistrictChange: (id: string) => void;
  onDisasterTypeChange: (type: SimDisasterType) => void;
  onRunComplete: (payload: RunCompletePayload) => void;
}) {
  const district = useMemo(
    () => SIMULATOR_DISTRICTS.find((d) => d.id === districtId) ?? SIMULATOR_DISTRICTS[0],
    [districtId],
  );
  const stations = useMemo(() => simulatorStationsFor(district.id), [district.id]);

  const pipeline = useMemo<SimulationStage[]>(
    () =>
      buildSimulationPipeline({
        districtName: district.name,
        disasterType,
        stations: stations.map((s) => ({ name: s.name, rdsEnabled: s.rdsEnabled })),
      }),
    [district.name, disasterType, stations],
  );

  // stageIndex: -1 idle, >=0 the stage currently being animated, and the
  // final stage stays visible once the run completes (celebration state).
  const [stageIndex, setStageIndex] = useState(-1);
  const [runKey, setRunKey] = useState(0);
  const completedRef = useRef(false);

  // District / disaster change → reset to idle.
  useEffect(() => {
    setStageIndex(-1);
    setRunKey(0);
    completedRef.current = false;
  }, [district.id, disasterType]);

  // New run (runId bumped) → start from stage 0.
  useEffect(() => {
    if (runId > 0) {
      completedRef.current = false;
      setRunKey((k) => k + 1);
      setStageIndex(0);
    }
  }, [runId]);

  const running = stageIndex >= 0 && stageIndex < pipeline.length - 1;
  const done = stageIndex >= pipeline.length - 1 && runKey > 0;

  // Advance through the pipeline stages.
  useEffect(() => {
    if (stageIndex < 0 || stageIndex >= pipeline.length - 1) return;
    const timer = window.setTimeout(() => {
      setStageIndex((prev) => (prev < pipeline.length - 1 ? prev + 1 : prev));
    }, pipeline[stageIndex].durationMs);
    return () => window.clearTimeout(timer);
  }, [stageIndex, pipeline]);

  // Signal completion once, when the final stage is reached.
  useEffect(() => {
    if (done && !completedRef.current) {
      completedRef.current = true;
      onRunComplete({
        districtId: district.id,
        disasterType,
        stations: stations.map((s) => ({
          name: s.name,
          frequency: s.frequency,
          type: s.type,
          rdsEnabled: s.rdsEnabled,
          lat: s.lat ?? null,
          lng: s.lng ?? null,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const progress = stageIndex >= 0 ? ((stageIndex + 1) / pipeline.length) * 100 : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* ------------------------------------------------ District map */}
      <div className="relative h-[420px] overflow-hidden rounded-xl border border-[#1c2740] bg-[#0b1120] lg:col-span-3">
        <DistrictMap
          districtId={district.id}
          stations={stations}
          onSelect={onDistrictChange}
        />
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-[#0b1120]/90 px-3 py-2 text-[0.6875rem] text-slate-300 shadow-lg">
          Click a district to simulate a calamity there
        </div>
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-[#0b1120]/90 px-3 py-1.5 text-[0.6875rem] text-slate-400 shadow-lg">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_2px_rgba(245,158,11,0.5)]" />
          AIR · mandatory EWS
          <span className="ml-2 h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_2px_rgba(56,189,248,0.5)]" />
          Private / community
        </div>
      </div>

      {/* ------------------------------------------------ Controls + pipeline */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        {/* District + disaster picker */}
        <div className="rounded-xl border border-[#1c2740] bg-[#0b1120] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            {district.name}, {district.state}
          </p>
          <div className="flex flex-wrap gap-2">
            {DISASTER_TYPES.map((type) => {
              const allowed = district.disasterTypes.includes(type);
              const active = type === disasterType;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={!allowed || running}
                  onClick={() => onDisasterTypeChange(type)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
                    active
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-300"
                      : "border-[#1c2740] bg-[#0a0f1a] text-slate-400 hover:border-amber-500/30 hover:text-amber-300"
                  }`}
                  title={
                    allowed
                      ? `Simulate a ${type} in ${district.name}`
                      : `No ${type} template for ${district.name}`
                  }
                >
                  {DISASTER_ICONS[type]} {type}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={running}
            onClick={onStartRun}
            className="mt-4 w-full rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {running ? "Simulating…" : `Simulate ${disasterType} in ${district.name}`}
          </button>
          <p className="mt-2 text-[0.6875rem] text-slate-600">
            100% simulated — no real stations are contacted.
          </p>
        </div>

        {/* Animated pipeline */}
        <div className="flex-1 rounded-xl border border-[#1c2740] bg-[#0b1120] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">
              <RadioTower className="h-3.5 w-3.5 text-amber-400" />
              Broadcast pipeline
            </p>
            {running && (
              <span className="text-[0.6875rem] font-semibold text-amber-300">
                {Math.round(progress)}%
              </span>
            )}
          </div>

          {running && (
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-[#1c2740]">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {stageIndex < 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed border-[#1c2740] text-center">
              <Sparkles className="mb-2 h-6 w-6 text-slate-600" />
              <p className="text-sm text-slate-500">
                Pick a district on the map and press{" "}
                <span className="font-semibold text-red-300">Simulate</span>.
              </p>
            </div>
          ) : (
            <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
              {pipeline.map((stage, i) => {
                const isDone = i < stageIndex;
                const isActive = i === stageIndex;
                return (
                  <li
                    key={i}
                    className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm transition ${
                      isActive
                        ? "border-amber-500/40 bg-amber-500/5 text-amber-200"
                        : isDone
                          ? "border-emerald-500/20 bg-emerald-500/5 text-slate-300"
                          : "border-[#1c2740] bg-[#0a0f1a] text-slate-500"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    ) : isActive ? (
                      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-400" />
                    ) : (
                      <StageIcon type={stage.type} />
                    )}
                    <span className="min-w-0 flex-1">{stage.label}</span>
                    {isDone && stage.type === "rds" && (
                      <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {done && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm font-bold text-emerald-300">
              <Zap className="h-4 w-4" />
              All {stations.length} stations confirmed — broadcast complete
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StageIcon({ type }: { type: SimulationStage["type"] }) {
  if (type === "detect") return <RadioTower className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />;
  if (type === "voice") return <AudioLines className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />;
  if (type === "push") return <Zap className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />;
  if (type === "rds") return <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />;
  return <Radio className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />;
}

/** MapLibre canvas with clickable district + station markers. */
function DistrictMap({
  districtId,
  stations,
  onSelect,
}: {
  districtId: string;
  stations: Array<{ lat: number | null; lng: number | null; name: string; type: string }>;
  onSelect: (id: string) => void;
}) {
  const selected = SIMULATOR_DISTRICTS.find((d) => d.id === districtId);

  return (
    <MapGl
      mapLib={maplibregl}
      mapStyle={MAP_STYLE}
      initialViewState={{ longitude: 80.0, latitude: 22.0, zoom: 4.3 }}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="bottom-right" />

      {/* District hotspots */}
      {SIMULATOR_DISTRICTS.map((d) => {
        const active = d.id === districtId;
        return (
          <Marker
            key={d.id}
            longitude={d.lng}
            latitude={d.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelect(d.id);
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(d.id);
              }}
              className="group relative flex flex-col items-center"
              aria-label={`Simulate in ${d.name}`}
            >
              {active && (
                <span className="absolute -inset-2 animate-ping rounded-full bg-red-500/40" />
              )}
              <span
                className={`relative flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-lg transition ${
                  active ? "scale-125 bg-red-500" : "bg-slate-600 group-hover:bg-amber-500"
                }`}
              />
              <span
                className={`pointer-events-none mt-1 rounded px-1.5 py-0.5 text-[0.625rem] font-bold shadow ${
                  active ? "bg-red-500 text-white" : "bg-slate-900/80 text-slate-300"
                }`}
              >
                {d.name}
              </span>
            </button>
          </Marker>
        );
      })}

      {/* Covering station markers for the selected district */}
      {selected &&
        stations.map(
          (s) =>
            s.lat !== null &&
            s.lng !== null && (
              <Marker key={s.name} longitude={s.lng} latitude={s.lat} anchor="bottom">
                <span
                  className={`block h-3 w-3 rounded-full border border-white shadow-lg ${
                    s.type === "air" ? "bg-amber-400" : "bg-sky-400"
                  }`}
                  title={s.name}
                />
              </Marker>
            ),
        )}
    </MapGl>
  );
}
