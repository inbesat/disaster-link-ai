"use client";

// ---------------------------------------------------------------------
// components/demo/fm/FmBroadcastDemo.tsx — Phase 9/10 · the
// /demo/fm-broadcast page: FM Broadcast Simulator + Judges' View.
//
// Owns the shared simulation state (district, disaster type, run results)
// and composes the two panels. Supports the QR quick-start flow:
//   /demo/fm-broadcast?district=patna&disaster=flood&autoplay=1
// auto-runs "Simulate Flood in Patna" on load.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RadioTower, ShieldCheck } from "lucide-react";
import FmBroadcastSimulator, {
  type RunCompletePayload,
  type SimDisasterType,
} from "./FmBroadcastSimulator";
import FmJudgesPanel from "./FmJudgesPanel";
import { SIMULATOR_DISTRICTS } from "@/lib/fm/simulation";

const QUICK_STARTS: Array<{ label: string; district: string; disaster: SimDisasterType }> = [
  { label: "Simulate Flood in Patna", district: "patna", disaster: "flood" },
  { label: "Simulate Cyclone in Puri", district: "puri", disaster: "cyclone" },
  { label: "Simulate Heatwave in Delhi", district: "delhi", disaster: "heatwave" },
  { label: "Simulate Flood in Malda", district: "malda", disaster: "flood" },
];

export default function FmBroadcastDemo() {
  const [districtId, setDistrictId] = useState("patna");
  const [disasterType, setDisasterType] = useState<SimDisasterType>("flood");
  const [runId, setRunId] = useState(0);
  const [run, setRun] = useState<RunCompletePayload | null>(null);
  const [runKey, setRunKey] = useState(0);
  const autoStartedRef = useRef(false);

  const startRun = useCallback(() => setRunId((id) => id + 1), []);

  const handleRunComplete = useCallback((payload: RunCompletePayload) => {
    setRun(payload);
    setRunKey((k) => k + 1);
  }, []);

  const handleDistrictChange = useCallback((id: string) => {
    setDistrictId(id);
    setRun(null);
    setRunKey(0);
  }, []);

  const handleDisasterChange = useCallback((type: SimDisasterType) => {
    setDisasterType(type);
    setRun(null);
    setRunKey(0);
  }, []);

  /** QR quick-start: ?district=…&disaster=…&autoplay=1 → run once on load. */
  useEffect(() => {
    if (autoStartedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("district");
    const dis = params.get("disaster") as SimDisasterType | null;
    if (d && SIMULATOR_DISTRICTS.some((x) => x.id === d)) setDistrictId(d);
    if (dis && ["flood", "cyclone", "earthquake", "heatwave"].includes(dis)) {
      setDisasterType(dis);
    }
    if (params.get("autoplay") === "1") {
      autoStartedRef.current = true;
      // Let the map + pipeline settle before kicking the animation.
      const timer = window.setTimeout(startRun, 900);
      return () => window.clearTimeout(timer);
    }
  }, [startRun]);

  const quickStart = useCallback(
    (district: string, disaster: SimDisasterType) => {
      setDistrictId(district);
      setDisasterType(disaster);
      setRun(null);
      setRunKey(0);
      // Start after state settles.
      window.setTimeout(() => setRunId((id) => id + 1), 150);
    },
    [],
  );

  return (
    <main className="min-h-screen bg-[#060a14] px-4 py-6 text-foreground">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 rounded-md border border-[#1c2740] bg-[#0b1120] px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Demo
            </Link>
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <RadioTower className="h-5 w-5 text-amber-400" />
              FM Broadcast Simulator
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              100% simulated
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AI-voiced calamity alerts → FM radio · CAP · RDS · IVR fallback
          </p>
        </div>

        {/* Quick-start chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_STARTS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => quickStart(q.district, q.disaster)}
              className="rounded-full border border-[#1c2740] bg-[#0b1120] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-500/40 hover:text-amber-300"
            >
              ▶ {q.label}
            </button>
          ))}
        </div>

        {/* Simulator + judges' panel */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FmBroadcastSimulator
              districtId={districtId}
              disasterType={disasterType}
              runId={runId}
              onStartRun={startRun}
              onDistrictChange={handleDistrictChange}
              onDisasterTypeChange={handleDisasterChange}
              onRunComplete={handleRunComplete}
            />
          </div>
          <aside className="self-start lg:sticky lg:top-6">
            <FmJudgesPanel
              districtId={districtId}
              disasterType={disasterType}
              run={run}
              runKey={runKey}
            />
          </aside>
        </div>

        <footer className="mt-8 border-t border-[#1c2740] pt-4 text-center text-[0.6875rem] text-slate-600">
          Judges&apos; sandbox · nothing here contacts real FM stations ·
          production dispatch runs through /api/broadcast/fm/dispatch with CAP + audio
        </footer>
      </div>
    </main>
  );
}
