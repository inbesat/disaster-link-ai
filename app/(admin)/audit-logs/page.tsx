"use client";

// ---------------------------------------------------------------------
// app/(admin)/audit-logs/page.tsx — Admin · Audit Logs console (Phase 18 · Step 5).
//
// Filterable, exportable trail of security-relevant admin actions:
// logins, role changes, data exports, alert sends, AI plan executions,
// shelter/resource changes. Events are written server-side by
// lib/admin/audit-logger.ts (logAdminAction); this console reads the
// seeded demo trail via the listAuditLogs server action.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, ScrollText, Search } from "lucide-react";
import { listAuditLogs } from "@/app/actions/admin";
import {
  auditEventsToCsv,
  filterAuditEvents,
  relativeAuditTime,
  type AuditEvent,
  type AuditSeverity,
} from "@/lib/settings/privacy-settings";

const SEVERITY_STYLES: Record<AuditSeverity, string> = {
  info: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  critical: "border-red-500/40 bg-red-500/10 text-red-400",
};

const SEVERITY_OPTIONS: { value: AuditSeverity | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

export default function AuditLogsPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<AuditSeverity | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAuditLogs().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => filterAuditEvents(events, { severity, query }),
    [events, severity, query],
  );

  function exportCsv() {
    const blob = new Blob([auditEventsToCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "drip-audit-logs.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} audit entries.`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Review the trail of administrative actions and acknowledgements.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-40"
        >
          <Download className="h-4 w-4" aria-hidden />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Filter by severity"
          className="flex flex-wrap items-center gap-1 rounded-md border border-[#1c2740] bg-[#0b1120] p-1"
        >
          {SEVERITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={severity === option.value}
              onClick={() => setSeverity(option.value)}
              className={`rounded px-2.5 py-1.5 text-[11px] font-bold transition ${
                severity === option.value
                  ? "bg-amber-500/15 text-amber-200"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, actor, IP…"
            className="w-full rounded-md border border-[#1c2740] bg-[#0b1120] py-2 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-slate-500 focus:border-amber-400/60"
          />
        </div>

        <span className="ml-auto rounded-full border border-[#1c2740] bg-[#0b1120] px-2.5 py-1 text-xs tabular-nums text-slate-400">
          {filtered.length} event{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#1c2740] bg-[#0b1120]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#1c2740] text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Resource</th>
                <th className="px-4 py-3 font-semibold">IP</th>
                <th className="px-4 py-3 text-right font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151d31]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Loading audit trail…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No events match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((event) => (
                  <tr key={event.id} className="transition hover:bg-[#131b30]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY_STYLES[event.severity]}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              event.severity === "critical"
                                ? "bg-red-400"
                                : event.severity === "warning"
                                  ? "bg-amber-400"
                                  : "bg-cyan-400"
                            }`}
                          />
                          {event.severity}
                        </span>
                        <span className="font-mono text-[11px] font-semibold text-slate-200">
                          {event.action}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{event.actor}</td>
                    <td className="px-4 py-3 text-slate-400">{event.resource}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {event.ip}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-400">
                      {relativeAuditTime(event.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <ScrollText className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Append-only trail — written on every privileged action (role change,
        config save, alert send, AI plan run) by the server-side audit logger.
      </p>
    </div>
  );
}
