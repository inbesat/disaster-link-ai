"use client";

// ---------------------------------------------------------------------
// components/debug/BenchmarkPanel.tsx — Offline-First Architecture · Phase 10
// "Performance Monitor" developer panel (Stitch/Antigravity spec).
//
// Grid of 6 metric cards, dark theme with neon accents for good metrics
// and orange for warnings:
//   • AI Latency    — number + sparkline, target < 3 s
//   • Token Speed   — gauge, ≥ 12 tps
//   • Memory        — horizontal bar, used / 2 GB cap
//   • Sync Speed    — number, last full sync duration
//   • Storage       — donut, used / quota
//   • Cache Hit Rate— percentage, ≥ 90%
//
// Refreshes in real time every 2 seconds, and it collapses into a sidebar
// rail on desktop. Everything is SSR-safe (renders a loading skeleton until
// the first report lands in the browser).
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Gauge as GaugeIcon, HardDrive, Activity, Zap, RefreshCw, Radio } from "lucide-react";
import { runBenchmarks, type BenchmarkReport } from "@/lib/perf/benchmark";
import { checkPerformanceBudget, PERFORMANCE_BUDGET, type BudgetViolation } from "@/lib/perf/budget";

const REFRESH_INTERVAL_MS = 2000;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const magnitude = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, magnitude)).toFixed(magnitude > 1 ? 0 : 1)} ${units[magnitude]}`;
}

function formatMs(ms: number): string {
  return ms > 0 ? `${(ms / 1000).toFixed(1)}s` : "—";
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// --- small SVG primitives (no chart dependency) --------------------------

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="h-8" />;
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 24}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Donut({ fraction, color }: { fraction: number; color: string }) {
  const circumference = 2 * Math.PI * 15.5;
  const offset = circumference * (1 - clamp01(fraction));
  return (
    <svg viewBox="0 0 40 40" className="h-12 w-12" aria-hidden>
      <circle cx="20" cy="20" r="15.5" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r="15.5"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

function Gauge({ fraction, color }: { fraction: number; color: string }) {
  return (
    <svg viewBox="0 0 100 60" className="h-14 w-24" aria-hidden>
      <path
        d="M 10 55 A 40 40 0 0 1 90 55"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="8"
        strokeLinecap="round"
        pathLength={1}
      />
      <path
        d="M 10 55 A 40 40 0 0 1 90 55"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={clamp01(fraction)}
      />
    </svg>
  );
}

// --- panel ----------------------------------------------------------------

interface CardProps {
  label: string;
  value: string;
  sub: string;
  ok: boolean;
  icon: React.ReactNode;
  accent: string;
  children?: React.ReactNode;
}

function MetricCard({ label, value, sub, ok, icon, accent, children }: CardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-[#0d1424] p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <span className="text-slate-500">{icon}</span>
      </div>
      <p className={`font-mono text-2xl font-black tracking-tight ${ok ? accent : "text-orange-400"}`}>
        {value}
      </p>
      <p className="text-[11px] text-slate-500">{sub}</p>
      {children}
    </div>
  );
}

export function BenchmarkPanel() {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [violations, setViolations] = useState<BudgetViolation[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [running, setRunning] = useState(false);
  const cancelledRef = useRef(false);

  const refresh = useCallback(async () => {
    if (typeof indexedDB === "undefined") return;
    setRunning(true);
    try {
      const next = await runBenchmarks({});
      setReport(next);
      setViolations(checkPerformanceBudget(next));
      setLatencyHistory((prev) => [...prev.slice(-29), next.aiLatencyMs || 0]);
    } finally {
      setRunning(false);
    }
  }, []);

  // Real-time refresh every 2 s (spec) + an immediate first run.
  useEffect(() => {
    cancelledRef.current = false;
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      cancelledRef.current = true;
      window.clearInterval(timer);
    };
  }, [refresh]);

  const memo = useMemo(() => {
    const v = violations;
    const okFor = (key: string) => !v.some((x) => x.key === key && !x.ok && !x.untested);
    const B = PERFORMANCE_BUDGET;
    return {
      aiOk: okFor("aiLatencyMs"),
      tpsOk: okFor("minTokensPerSecond"),
      loadOk: okFor("modelLoadMs"),
      syncOk: okFor("syncMs"),
      storageOk: okFor("storageBytes"),
      cacheOk: okFor("minCacheHitRate"),
      storageFraction: report?.quotaBytes ? (report.storageBytes ?? 0) / report.quotaBytes : 0,
      cacheFraction: report?.cacheHitRate ?? 0,
      memoryFraction: report?.memoryBytes ? report.memoryBytes / (2 * 1024 ** 3) : 0,
      memoryLabel: formatBytes(report?.memoryBytes ?? 0),
      storageLabel: report
        ? `${formatBytes(report.storageBytes)} / ${formatBytes(report.quotaBytes)}`
        : "— / —",
      cacheLabel: report ? `${Math.round((report.cacheHitRate ?? 0) * 100)}%` : "—",
      syncLabel: formatMs(report?.syncMs ?? 0),
      aiLabel: formatMs(report?.aiLatencyMs ?? 0),
      tpsLabel: report?.aiTested ? String(report.tokensPerSecond) : "—",
      loadLabel: formatMs(report?.modelLoadMs ?? 0),
      budget: B,
    };
  }, [violations, report]);

  const neon = "text-emerald-300";

  return (
    <div className="fixed right-4 top-1/2 z-40 -translate-y-1/2">
      <div className="w-[360px] rounded-2xl border border-white/10 bg-[rgb(var(--bg-primary-rgb)/95)] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
            <Activity aria-hidden className="h-3.5 w-3.5 text-cyan-400" />
            Performance Monitor
          </p>
          <div className="flex items-center gap-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <RefreshCw aria-hidden className={`h-3 w-3 ${running ? "animate-spin" : ""}`} />
              live
            </span>
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand panel" : "Collapse panel"}
              className="rounded-md p-1 text-slate-400 transition hover:bg-white/10"
            >
              {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {/* AI Latency */}
            <MetricCard
              label="AI Latency"
              value={memo.aiLabel}
              sub={`target < 3s`}
              ok={memo.aiOk}
              icon={<Zap className="h-3.5 w-3.5" />}
              accent={neon}
            >
              <Sparkline values={latencyHistory} color={memo.aiOk ? "#34d399" : "#fb923c"} />
            </MetricCard>

            {/* Token Speed */}
            <MetricCard
              label="Token Speed"
              value={memo.tpsLabel}
              sub={`target ≥ 12 tps`}
              ok={memo.tpsOk}
              icon={<GaugeIcon className="h-3.5 w-3.5" />}
              accent={neon}
            >
              <div className="flex items-center justify-center">
                <Gauge
                  fraction={report?.aiTested ? report.tokensPerSecond / 20 : 0}
                  color={memo.tpsOk ? "#34d399" : "#fb923c"}
                />
              </div>
            </MetricCard>

            {/* Memory */}
            <MetricCard
              label="Memory"
              value={memo.memoryLabel}
              sub="used / 2 GB heap"
              ok={true}
              icon={<HardDrive className="h-3.5 w-3.5" />}
              accent={neon}
            >
              <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${clamp01(memo.memoryFraction) * 100}%` }}
                />
              </div>
            </MetricCard>

            {/* Sync Speed */}
            <MetricCard
              label="Sync Speed"
              value={memo.syncLabel}
              sub={`target < 10s`}
              ok={memo.syncOk}
              icon={<Radio className="h-3.5 w-3.5" />}
              accent={neon}
            >
              <p className="text-[10px] text-slate-500">last full sync</p>
            </MetricCard>

            {/* Storage */}
            <MetricCard
              label="Storage"
              value={memo.storageLabel}
              sub={`soft budget 200 MB`}
              ok={memo.storageOk}
              icon={<HardDrive className="h-3.5 w-3.5" />}
              accent={neon}
            >
              <div className="flex items-center gap-2">
                <Donut fraction={memo.storageFraction} color={memo.storageOk ? "#34d399" : "#fb923c"} />
                <p className="text-[10px] text-slate-500">{Math.round(memo.storageFraction * 100)}% used</p>
              </div>
            </MetricCard>

            {/* Cache Hit Rate */}
            <MetricCard
              label="Cache Hit Rate"
              value={memo.cacheLabel}
              sub={`target ≥ 90%`}
              ok={memo.cacheOk}
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              accent={neon}
            >
              <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${memo.cacheOk ? "bg-emerald-400" : "bg-orange-400"}`}
                  style={{ width: `${clamp01(memo.cacheFraction) * 100}%` }}
                />
              </div>
            </MetricCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default BenchmarkPanel;
