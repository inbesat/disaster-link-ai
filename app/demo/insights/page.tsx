"use client";

// ---------------------------------------------------------------------
// app/demo/insights/page.tsx — Phase 2 · Step 9 · Judge tracking &
// demo analytics dashboard.
//
// A HIDDEN page (no nav link — the presenter opens /demo/insights) that
// visualises exactly what the judges touched during the pitch: every
// feature button, scenario switch and mode change recorded by
// lib/demo/analytics.ts in localStorage. Presenters can quote the stats
// during Q&A ("Judges interacted with 8 features. Most used: SOS
// Trigger.") and export the trail as JSON.
//
// Renders a friendly empty state when nothing has been tracked yet.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Clock,
  Download,
  MousePointerClick,
  Star,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import {
  clearAnalytics,
  getAnalyticsEvents,
  getDemoAnalyticsStats,
  type DemoAnalyticsEvent,
} from "@/lib/demo/analytics";

const FEATURE_LABELS: Record<string, string> = {
  "action.gov.flood-warning": "Trigger Flood Warning",
  "action.gov.test-alert": "Send Test Alert",
  "action.gov.deploy-resource": "Deploy Resource",
  "action.gov.road-close": "Close Road",
  "action.pub.elevate-risk": "Elevate My Risk",
  "action.pub.receive-alert": "Receive Alert",
  "action.pub.trigger-sos": "Trigger SOS",
  "action.pub.force-reroute": "Force Route Reroute",
};

function featureLabel(name: string): string {
  return FEATURE_LABELS[name] ?? name;
}

/** 65_000 ms → "1m 5s" */
function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function timeOf(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function DemoInsightsPage() {
  const [events, setEvents] = useState<DemoAnalyticsEvent[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setEvents(getAnalyticsEvents());
  }, [refresh]);

  const stats = getDemoAnalyticsStats();

  // Keep the page live-ish during a pitch: re-read every 2s.
  useEffect(() => {
    const id = window.setInterval(() => setRefresh((r) => r + 1), 2000);
    return () => window.clearInterval(id);
  }, []);

  const { totalInteractions, features, mostUsed, modeInteractions, modeMs } = stats;

  function handleExport() {
    const blob = new Blob([JSON.stringify(events, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demo-insights-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClear() {
    clearAnalytics();
    setEvents([]);
  }

  return (
    <main className="min-h-screen bg-[var(--brand-navy)] px-4 py-10 text-primary">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eoc-label mb-1 text-amber-500">DEMO ANALYTICS · HIDDEN</p>
            <h1 className="text-2xl font-bold">Judge Tracking &amp; Demo Insights</h1>
            <p className="mt-1 text-sm text-slate-400">
              What the judges actually touched during this pitch — perfect Q&amp;A ammo.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={events.length === 0}
              className="flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-600/15 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-600/25 disabled:opacity-50"
            >
              <Download aria-hidden="true" className="h-4 w-4" /> Export JSON
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={events.length === 0}
              className="flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-600/15 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-600/25 disabled:opacity-50"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="eoc-panel flex flex-col items-center gap-3 border border-white/10 bg-panel-deep/80 p-10 text-center">
            <BarChart3 aria-hidden="true" className="h-10 w-10 text-slate-600" />
            <h2 className="text-lg font-bold">Nothing tracked yet</h2>
            <p className="text-sm text-slate-400">
              Enter Gov or Citizen demo mode and trigger actions — this page will start
              counting every interaction live.
            </p>
            <Link
              href="/demo"
              className="mt-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-bold text-black transition hover:bg-amber-500"
            >
              Back to the demo landing
            </Link>
          </div>
        ) : (
          <>
            {/* Headline stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={MousePointerClick}
                label="Total interactions"
                value={String(totalInteractions)}
              />
              <StatCard icon={Activity} label="Features used" value={String(features.length)} />
              <StatCard icon={Users} label="Gov vs Citizen" value={`${modeInteractions.government} / ${modeInteractions.citizen}`} />
              <StatCard icon={Clock} label="Session time" value={formatDuration(modeMs.government + modeMs.citizen)} />
            </div>

            {/* Most used feature */}
            <section className="mt-4 rounded-xl border border-amber-500/40 bg-amber-600/10 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                <Star aria-hidden="true" className="h-4 w-4" />
                Most used feature
              </p>
              <p className="mt-2 text-2xl font-black text-amber-300">
                {mostUsed ? `${featureLabel(mostUsed.name)} (${mostUsed.count} taps)` : "—"}
              </p>
            </section>

            {/* Time-in-mode breakdown — Drop-Stats copy for Q&A */}
            <section className="mt-4 rounded-xl border border-white/10 bg-panel-deep/80 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Timer aria-hidden="true" className="h-4 w-4" />
                Time spent in each mode (tracked)
              </p>
              <div className="mt-4 space-y-3">
                <ModeBar
                  label="Government demo"
                  ms={modeMs.government}
                  max={Math.max(modeMs.government, modeMs.citizen, 1)}
                  tone="bg-blue-500"
                />
                <ModeBar
                  label="Citizen demo"
                  ms={modeMs.citizen}
                  max={Math.max(modeMs.government, modeMs.citizen, 1)}
                  tone="bg-emerald-500"
                />
              </div>
            </section>

            {/* Recent trail */}
            <section className="mt-4 rounded-xl border border-white/10 bg-panel-deep/80 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Recent activity
              </p>
              <ul className="mt-3 divide-y divide-white/10">
                {[...events].slice(-12).reverse().map((e, i) => (
                  <li key={`${e.ts}-${i}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate text-sm font-medium text-primary">
                      {featureLabel(e.name)}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide ${
                          e.mode === "citizen"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-blue-500/15 text-blue-300"
                        }`}
                      >
                        {e.mode}
                      </span>
                      <span className="font-mono text-xs text-slate-500">{timeOf(e.ts)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-panel-deep/80 p-4">
      <p className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-widest text-slate-400">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-primary">{value}</p>
    </div>
  );
}

function ModeBar({
  label,
  ms,
  max,
  tone,
}: {
  label: string;
  ms: number;
  max: number;
  tone: string;
}) {
  const pct = Math.max(4, Math.round((ms / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-primary">{label}</span>
        <span className="font-mono text-xs text-slate-400">{formatDuration(ms)}</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}