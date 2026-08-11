"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/AlertAnalytics.tsx — Phase 11 · Step 9 ·
// Alert Delivery Analytics & Tracking.
//
// Dashboard panel answering the question "did the message actually reach
// the citizens?" for the most recent alert: an aggregate reached counter
// plus per-channel delivery/engagement breakdowns (SMS delivery, In-App
// read + Safe acknowledgment, Voice answer rate).
//
// The figures below are deterministic mocks — see lib/mock-data
// gov-alert-targets for where per-channel recipients are derived. The
// bars render from the CHANNELS descriptors so everything stays honest.
// ---------------------------------------------------------------------

import { Bell, MessageSquare, Phone, RadioTower, Smartphone } from "lucide-react";

const REACHED = 12_450;
const TOTAL = 15_000;

type MetricBar = {
  label: string;
  /** 0–100 */
  pct: number;
  /** tailwind bg for the fill */
  bar: string;
  /** trailing note after the pct, e.g. "(Network Error)" */
  note?: string;
};

type ChannelMetric = {
  id: string;
  label: string;
  icon: typeof MessageSquare;
  bars: MetricBar[];
};

const CHANNELS: ChannelMetric[] = [
  {
    id: "sms",
    label: "SMS",
    icon: MessageSquare,
    bars: [
      { label: "Delivered", pct: 95, bar: "bg-emerald-400" },
      { label: "Failed", pct: 5, bar: "bg-severity-red-500", note: "Network Error" },
    ],
  },
  {
    id: "app",
    label: "In-App Push",
    icon: Smartphone,
    bars: [
      { label: "Read", pct: 80, bar: "bg-accent-primary" },
      { label: 'Acknowledged "Safe"', pct: 45, bar: "bg-accent-purple" },
    ],
  },
  {
    id: "voice",
    label: "Voice Call",
    icon: Phone,
    bars: [{ label: "Answered", pct: 60, bar: "bg-severity-amber-400" }],
  },
];

export function AlertAnalytics() {
  const reachedPct = Math.round((REACHED / TOTAL) * 100);

  return (
    <section
      className="rounded-xl border border-white/10 bg-secondary p-5"
      aria-label="Alert delivery analytics"
    >
      <header className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-purple/30 bg-accent-purple/10 text-accent-purple">
          <Bell className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Delivery Analytics
          </h2>
          <p className="truncate text-xs text-muted">
            Flood Warning · Patna → Danapur · dispatched today 14:32
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-emerald-300">
          <RadioTower className="h-3.5 w-3.5" aria-hidden /> Live
        </span>
      </header>

      {/* Aggregate reached counter + progress bar. */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[0.625rem] font-bold uppercase tracking-wider text-slate-400">
            Reached (aggregate)
          </p>
          <p className="font-mono text-sm font-bold tabular-nums text-emerald-300">
            {REACHED.toLocaleString()} of {TOTAL.toLocaleString()} · {reachedPct}%
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={reachedPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Aggregate delivery rate"
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
            style={{ width: `${reachedPct}%` }}
          />
        </div>
        <p className="mt-2 text-[0.6875rem] leading-snug text-slate-400">
          {REACHED.toLocaleString()} of {TOTAL.toLocaleString()} citizens reached ·{" "}
          {reachedPct}% delivery success across all channels.
        </p>
      </div>

      {/* Per-channel breakdown. */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <div
              key={channel.id}
              className="rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-slate-300">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                {channel.label}
              </p>
              <div className="mt-2.5 space-y-2">
                {channel.bars.map((bar) => (
                  <div key={bar.label}>
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-[0.6875rem] text-slate-300">{bar.label}</p>
                      <p className="shrink-0 font-mono text-[0.6875rem] font-bold tabular-nums text-white">
                        {bar.pct}%
                        {bar.note && (
                          <span className="ml-1 font-sans font-normal text-severity-red-300">
                            ({bar.note})
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${bar.bar}`}
                        style={{ width: `${bar.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default AlertAnalytics;
