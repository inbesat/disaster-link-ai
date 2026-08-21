"use client";

import { useState } from "react";
import { Check, Clock, Radio, Send, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import IncidentTimeline from "@/components/gov/dashboard/IncidentTimeline";

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
    dot: "bg-red-400",
    label: "text-red-300",
    chip: "bg-red-400/10",
    border: "border-l-red-400",
  },
  warning: {
    dot: "bg-amber-400",
    label: "text-amber-300",
    chip: "bg-amber-400/10",
    border: "border-l-amber-400",
  },
  info: {
    dot: "bg-blue-400",
    label: "text-blue-400",
    chip: "bg-blue-500/15",
    border: "border-l-blue-400",
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
    <section className="flex h-full min-h-[380px] flex-col rounded-xl border border-white/10 bg-[#111827] backdrop-blur transition hover:border-white/20">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Radio aria-hidden="true" className="h-4 w-4 text-blue-400" />
          <h2 className="eoc-label text-white">Incoming Alerts</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-xs font-semibold text-white/70">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          {alerts.length} queued
        </span>
      </header>

      {/* Segmented tab control */}
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
                ? "bg-blue-500/25 text-blue-400"
                : "text-slate-400 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <t.icon aria-hidden="true" className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab overlay body */}
      {tab === "alerts" ? (
        <ul className="flex-1 space-y-2 overflow-y-auto p-3">
          {alerts.map((alert, index) => {
            const s = SEVERITY_STYLES[alert.severity];
            const isSent = sent.has(alert.id);
            const isUnread = index < 2;
            return (
              <li
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border-l-2 ${s.border} bg-white/[0.03] p-3 transition-all duration-200 ${
                  isSent
                    ? "opacity-60"
                    : "hover:bg-white/[0.06] hover:shadow-[0_0_10px_rgba(255,255,255,0.02)]"
                } ${isUnread ? "border-l-4" : ""}`}
              >
                <span className={`mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full ${s.dot}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-snug ${isUnread ? "font-bold text-white" : "font-medium text-white/80"}`}>
                    {alert.title}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
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
                      ? "cursor-default border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border border-blue-400/40 bg-blue-500/20 text-blue-400 hover:bg-blue-500/35 hover:shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                  }`}
                >
                  {isSent ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                  {isSent ? "Sent" : "Send"}
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

      <footer className="flex items-center justify-between border-t border-white/10 px-5 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
          One-tap broadcast reaches all opted-in residents.
        </div>
        <button
          type="button"
          className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
        >
          View All →
        </button>
      </footer>
    </section>
  );
}

export default AlertFeedWidget;
