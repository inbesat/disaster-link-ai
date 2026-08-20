"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/AuditLogCard.tsx — Privacy (Phase 6 · Step 6).
//
// Account Audit Log — enterprise compliance event tracker:
//   • Dense, high-density table with Timestamp, Event Action,
//     IP Address/Device, and Status columns.
//   • Seeded events: Login Success, Exported Data, Changed Alert
//     Settings, Revoked API Key, Triggered AI Plan, Role Updated.
//   • Free-text search bar across action, actor, resource, IP, device +
//     a severity segmented filter (All / Success / Warning / Critical).
//   • "Export Logs to CSV" button downloads the filtered view.
//   • Fixed ISO timestamps rendered deterministically (UTC) so SSR and
//     client hydration always match.
// ---------------------------------------------------------------------

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, ScrollText, Search } from "lucide-react";
import {
  DEMO_AUDIT_EVENTS,
  auditEventsToCsv,
  filterAuditEvents,
  formatAuditTimestamp,
  type AuditSeverity,
} from "@/lib/settings/privacy-settings";

/** Enterprise status labels shown in the Status column. */
const STATUS_LABELS: Record<AuditSeverity, string> = {
  info: "Success",
  warning: "Warning",
  critical: "Critical",
};

const STATUS_STYLES: Record<AuditSeverity, string> = {
  info: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  critical: "border-red-500/40 bg-red-500/10 text-red-400",
};

const STATUS_DOT: Record<AuditSeverity, string> = {
  info: "bg-emerald-400",
  warning: "bg-amber-400",
  critical: "bg-red-400",
};

const FILTER_OPTIONS: { value: AuditSeverity | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "info", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

export default function AuditLogCard() {
  const [severity, setSeverity] = useState<AuditSeverity | "all">("all");
  const [query, setQuery] = useState("");

  const events = useMemo(
    () => filterAuditEvents(DEMO_AUDIT_EVENTS, { severity, query }),
    [severity, query],
  );

  function exportCsv() {
    const csv = auditEventsToCsv(events);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `account-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${events.length} audit entr${events.length === 1 ? "y" : "ies"} to CSV.`);
  }

  return (
    <section
      data-settings-key="privacy-audit-log"
      className="overflow-hidden rounded-eoc border border-panel-border bg-surface"
    >
      {/* Card header — compliance-tool masthead */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <ScrollText className="h-5 w-5 text-emerald-300" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-emerald-300/80">COMPLIANCE TRAIL · APPEND-ONLY</p>
            <h2 className="mt-0.5 text-lg font-bold">Account Audit Log</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={events.length === 0}
          className="inline-flex items-center gap-2 rounded-md border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Export Logs to CSV
        </button>
      </div>

      {/* Toolbar — search + status filter + record count */}
      <div className="flex flex-wrap items-center gap-3 border-b border-panel-border bg-surface-muted/30 px-5 py-3">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, actor, IP, device…"
            className="w-full rounded-md border border-panel-border bg-[#0a0f1d] py-2 pl-9 pr-3 font-mono text-xs text-slate-100 outline-none placeholder:font-sans placeholder:text-slate-600 focus:border-emerald-400/60"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-wrap items-center gap-1 rounded-md border border-panel-border bg-[#0a0f1d] p-1"
        >
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={severity === option.value}
              onClick={() => setSeverity(option.value)}
              className={`rounded px-2.5 py-1.5 text-[11px] font-bold transition ${
                severity === option.value
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <span className="ml-auto rounded-full border border-panel-border bg-[#0a0f1d] px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-400">
          {events.length} / {DEMO_AUDIT_EVENTS.length} records
        </span>
      </div>

      {/* Dense data table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-panel-border bg-[#0a0f1d] text-[10px] uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-bold">Timestamp</th>
              <th className="px-5 py-2.5 font-bold">Event Action</th>
              <th className="px-5 py-2.5 font-bold">IP Address / Device</th>
              <th className="px-5 py-2.5 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-divide font-mono text-[11px]">
            {events.map((event) => (
              <tr
                key={event.id}
                className="transition-colors hover:bg-surface-muted/40"
              >
                <td className="whitespace-nowrap px-5 py-2.5 tabular-nums text-slate-300">
                  {formatAuditTimestamp(event.timestamp)}
                </td>
                <td className="px-5 py-2.5">
                  <p className="font-semibold tracking-wide text-slate-100">
                    {event.action}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {event.actor} · {event.resource}
                  </p>
                </td>
                <td className="px-5 py-2.5">
                  <p className="tabular-nums text-cyan-300/90">{event.ip}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{event.device}</p>
                </td>
                <td className="px-5 py-2.5 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[event.severity]}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[event.severity]}`}
                      aria-hidden
                    />
                    {STATUS_LABELS[event.severity]}
                  </span>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-10 text-center font-sans text-xs text-slate-500"
                >
                  No events match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Compliance footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-panel-border bg-surface-muted/30 px-5 py-3">
        <p className="text-[11px] text-slate-500">
          Trail is append-only — entries can be reviewed but never edited or
          deleted. Written by the server-side audit logger on every privileged
          action.
        </p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
          SOC 2 · DPDP 2023 §17
        </p>
      </div>
    </section>
  );
}
