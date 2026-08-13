"use client";

// ---------------------------------------------------------------------
// app/debug/performance/page.tsx — Offline-First Architecture · Phase 10
// Developer "Performance Monitor" page. Mounts the BenchmarkPanel (the
// floating collapsible rail of 6 metric cards, refreshed every 2 s) plus
// a static backdrop explaining the Phase 10 budget targets.
// ---------------------------------------------------------------------

import BenchmarkPanel from "@/components/debug/BenchmarkPanel";
import { PERFORMANCE_BUDGET } from "@/lib/perf/budget";
import { formatBytes } from "@/lib/offline-sync/quota";

const ROWS = [
  { label: "AI latency", target: "< 3 s", budget: `${PERFORMANCE_BUDGET.aiLatencyMs} ms` },
  { label: "Token speed", target: "≥ 12 tps", budget: `${PERFORMANCE_BUDGET.minTokensPerSecond} tps` },
  { label: "Model load", target: "< 15 s", budget: `${PERFORMANCE_BUDGET.modelLoadMs} ms` },
  { label: "Sync time", target: "< 10 s", budget: `${PERFORMANCE_BUDGET.syncMs} ms` },
  { label: "Storage used", target: "≤ 200 MB", budget: formatBytes(PERFORMANCE_BUDGET.storageBytes) },
  { label: "Cache hit rate", target: "≥ 90%", budget: `${PERFORMANCE_BUDGET.minCacheHitRate * 100}%` },
];

export default function DebugPerformancePage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a0f1a] p-6 text-slate-100">
      <div className="max-w-3xl">
        <p className="eoc-label text-slate-500">PHASE 10 · PERFORMANCE MONITOR</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          Offline performance & benchmark budgets
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          The panel on the right refreshes every 2 seconds and colour-codes each
          metric against the spec targets below. Green = within budget, orange =
          over budget, em-dash = not yet measurable on this device.
        </p>

        <div className="mt-6 rounded-xl border border-white/10 bg-[#0d1424] p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Performance budget
          </h2>
          <ul className="mt-3 divide-y divide-white/5">
            {ROWS.map((row) => (
              <li key={row.label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-semibold">{row.label}</span>
                <span className="font-mono text-xs text-slate-500">
                  {row.target} · {row.budget}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Optimisations in play: Web Worker inference (UI never freezes), streaming
          tokens, lazy model load, battery-aware sync (&lt;20% charge pauses it),
          and unload-on-background memory management.
        </p>
      </div>

      {/* Floating performance rail */}
      <BenchmarkPanel />
    </main>
  );
}