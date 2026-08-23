"use client";

import { useEffect, useRef, useState } from "react";

// The simulator evaluates scenarios at the map's current focus area.
const DEFAULT_LAT = 22;
const DEFAULT_LNG = 78;
const DEMO_ELEVATION_M = 30;

type WhatIfSimulatorProps = {
  lat?: number;
  lng?: number;
};

type RiskLevel = "Safe" | "Watch" | "Warning" | "Evacuate";

const RISK_META: Record<
  RiskLevel,
  { badge: string; text: string; ring: string; glow: string }
> = {
  Safe: {
    badge: "bg-severity-green-500",
    text: "text-severity-green-300",
    ring: "border-severity-green-500/60",
    glow: "shadow-glow-green",
  },
  Watch: {
    badge: "bg-severity-amber-500",
    text: "text-severity-amber-300",
    ring: "border-severity-amber-500/60",
    glow: "shadow-glow-amber",
  },
  Warning: {
    badge: "bg-severity-red-500",
    text: "text-severity-red-300",
    ring: "border-severity-red-500/60",
    glow: "shadow-glow-red",
  },
  Evacuate: {
    badge: "bg-severity-purple-500",
    text: "text-severity-purple-300",
    ring: "border-severity-purple-500/60",
    glow: "shadow-glow-purple",
  },
};

export default function WhatIfSimulator({
  lat = DEFAULT_LAT,
  lng = DEFAULT_LNG,
}: WhatIfSimulatorProps) {
  const [rainfall, setRainfall] = useState(120);
  const [saturation, setSaturation] = useState(45);
  const [result, setResult] = useState<{
    level: RiskLevel | null;
    confidence: number;
    loading: boolean;
  }>({ level: null, confidence: 0, loading: false });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSimulation(), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rainfall, saturation]);

  async function runSimulation() {
    setResult((prev) => ({ ...prev, loading: true }));
    try {
      const query = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        rainfall: String(rainfall),
        saturation: String(saturation),
        elevation: String(DEMO_ELEVATION_M),
      });
      const response = await fetch(`/api/predict?${query.toString()}`);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();

      const level = ["Safe", "Watch", "Warning", "Evacuate"].includes(data.riskLevel)
        ? (data.riskLevel as RiskLevel)
        : "Safe";
      setResult({
        level,
        confidence: Number(data.confidenceScore) || 0,
        loading: false,
      });
    } catch (error: unknown) {
      console.error("Simulator prediction failed:", error);
      setResult({ level: "Safe", confidence: 0, loading: false });
    }
  }

  const meta = result.level ? RISK_META[result.level] : RISK_META.Safe;
  const confidence = Math.round(result.confidence * 100);

  return (
    <div className="eoc-panel p-5">
      <p className="eoc-label mb-4 text-accent">WHAT-IF SIMULATOR</p>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="sim-rainfall" className="text-sm text-slate-300">
            Simulated Rainfall (mm)
          </label>
          <span className="text-sm font-semibold text-slate-100">{rainfall} mm</span>
        </div>
        <input
          id="sim-rainfall"
          type="range"
          min={0}
          max={500}
          value={rainfall}
          onChange={(e) => setRainfall(Number(e.target.value))}
          className="mt-2 w-full"
          style={{ accentColor: "#0ea5e9" }}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label htmlFor="sim-saturation" className="text-sm text-slate-300">
            Soil Saturation %
          </label>
          <span className="text-sm font-semibold text-slate-100">{saturation}%</span>
        </div>
        <input
          id="sim-saturation"
          type="range"
          min={0}
          max={100}
          value={saturation}
          onChange={(e) => setSaturation(Number(e.target.value))}
          className="mt-2 w-full"
          style={{ accentColor: "#f59e0b" }}
        />
      </div>

      <div
        className={`mt-6 flex flex-col items-center gap-1 rounded-eoc border ${meta.ring} ${meta.glow} px-4 py-5`}
      >
        <span className="eoc-label text-xs text-slate-500">CALCULATED AI RISK</span>
        <span className={`text-3xl font-bold ${meta.text}`}>
          {result.loading ? "…" : (result.level ?? "Safe")}
        </span>
        {result.level && (
          <span className="text-xs text-slate-400">Confidence: {confidence}%</span>
        )}
        <span className={`mt-1 h-2 w-16 rounded-full ${meta.badge}`} />
      </div>
    </div>
  );
}
