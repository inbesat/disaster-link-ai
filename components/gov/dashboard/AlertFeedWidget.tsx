"use client";

import { useState } from "react";
import { Check, Clock, Radio, Send, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import IncidentTimeline from "@/components/gov/dashboard/IncidentTimeline";

// ---------------------------------------------------------------------
// components/gov/dashboard/AlertFeedWidget.tsx — Phase 7 · Steps 4 + 8.
//
// 1×2 live feed of incoming system alerts (alert-engine output in
// production, mock rows here). Each row carries a one-tap "Send" action
// that broadcasts the alert to affected residents — instantly marking the
// row as sent with a confirmation toast, so a live demo never stalls.
//
// Step 8: a segmented Alerts | Timeline control turns the body into a
// tab overlay — the alerts feed, or the IncidentTimeline (chronological
// log of the response). Timeline events scroll within the same area.
// ---------------------------------------------------------------------

type IncomingAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  channel: string;
  title: string;
  time: string;
};

const INITIAL_ALERTS: IncomingAlert[] = [
  { id: "a1", severity: "critical", channel: "SMS + SIREN", title: "Ganga near danger level — Kankarbagh ghats", time: "just now" },
  { id: "a2", severity: "warning", channel: "PUSH", title: "IMD: heavy rain forecast — 120 mm / 12 h", time: "2m ago" },
  { id: "a3", severity: "warning", channel: "SMS", title: "Road submerged — Patna–Danapur stretch", time: "11m ago" },
  { id: "a4", severity: "critical", channel: "SMS + SIREN", title: "Evacuation advisory — Barh block", time: "24m ago" },
  { id: "a5", severity: "info", channel: "PUSH", title: "Shelter capacity update — Kankarbagh HS", time: "41m ago" },
  { id: "a6", severity: "warning", channel: "SMS", title: "Power outage — Sector 4, Bailey Road", time: "58m ago" },
];

const SEVERITY_STYLES = {
  critical: {
    dot: "bg-severity-red-400",
    ring: "border-severity-red-400/30",
    label: "text-severity-red-300",
    chip: "bg-severity-red-400/10",
  },
  warning: {
    dot: "bg-severity-amber-400",
    ring: "border-severity-amber-400/30",
    label: "text-severity-amber-300",
    chip: "bg-severity-amber-400/10",
  },
  info: {
    dot: "bg-[var(--dl-blue-light)]",
    ring: "border-[var(--dl-blue-light)]/30",
    label: "text-[var(--dl-blue-light)]",
    chip: "bg-[var(--dl-blue)]/15",
  },
} as const;

type FeedTab = "alerts" | "timeline";

export function AlertFeedWidget() {
  const toast = useToast();
  const [alerts] = useState(INITIAL_ALERTS);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<FeedTab>("alerts");

  const sendAlert = (alert: IncomingAlert) => {
    setSent((prev) => new Set(prev).add(alert.id));
    toast.success({
      title: "Alert broadcast",
      description: `${alert.title} — sent via ${alert.channel}`,
    });
  };

  const TABS: Array<{ key: FeedTab; label: string; icon: typeof Radio }> = [
    { key: "alerts", label: "Alerts", icon: Radio },
    { key: "timeline", label: "Timeline", icon: Clock },
  ];

  return (
    <section className="flex h-full min-h-[380px] flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-white/20">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Radio aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
          <h2 className="eoc-label text-white">Incoming Alerts</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[0.6875rem] font-semibold text-white/70">
          <span className="h-2 w-2 animate-pulse rounded-full bg-severity-green-400" aria-hidden />
          {alerts.length} queued
        </span>
      </header>

      {/* Step 8 — segmented tab control: alerts feed vs incident timeline. */}
      <div
        role="tablist"
        aria-label="Alert feed sections"
        className="flex items-center gap-1 border-b border-white/10 px-3 py-2"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`feed-tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls="feed-tabpanel"
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === t.key
                ? "bg-[var(--dl-blue)]/25 text-[var(--dl-blue-light)]"
                : "text-[var(--dl-text-muted)] hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <t.icon aria-hidden="true" className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab overlay body — alerts feed or incident timeline. */}
      {tab === "alerts" ? (
        <ul className="flex-1 space-y-2 overflow-y-auto p-3">
          {alerts.map((alert) => {
            const s = SEVERITY_STYLES[alert.severity];
            const isSent = sent.has(alert.id);
            return (
              <li
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border ${s.ring} bg-black/20 p-3 transition ${
                  isSent ? "opacity-60" : "hover:bg-black/30"
                }`}
              >
                <span className={`mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full ${s.dot}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-medium leading-snug text-white/90">{alert.title}</p>
                  <p className="mt-1 flex items-center gap-2 text-[0.6875rem] text-[var(--dl-text-muted)]">
                    <span className={`rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide ${s.chip} ${s.label}`}>
                      {alert.severity}
                    </span>
                    <span>{alert.channel}</span>
                    <span>·</span>
                    <span>{alert.time}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSent}
                  onClick={() => sendAlert(alert)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isSent
                      ? "cursor-default border border-severity-green-400/30 bg-severity-green-400/10 text-severity-green-300"
                      : "border border-[var(--dl-blue-light)]/40 bg-[var(--dl-blue)]/20 text-[var(--dl-blue-light)] hover:bg-[var(--dl-blue)]/35"
                  }`}
                >
                  {isSent ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                  {isSent ? "Sent" : "One-Tap Send"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div
          id="feed-tabpanel"
          role="tabpanel"
          aria-labelledby="feed-tab-timeline"
          className="flex-1 overflow-hidden p-3"
        >
          <IncidentTimeline />
        </div>
      )}

      <footer className="flex items-center gap-2 border-t border-white/10 px-5 py-3 text-[0.6875rem] text-[var(--dl-text-muted)]">
        <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
        One-tap broadcast reaches all opted-in residents in the district.
      </footer>
    </section>
  );
}

export default AlertFeedWidget;
