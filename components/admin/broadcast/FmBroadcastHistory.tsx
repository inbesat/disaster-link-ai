"use client";

// ---------------------------------------------------------------------
// components/admin/broadcast/FmBroadcastHistory.tsx — Phase 8 · Broadcast
// History (compliance archive).
//
// Filterable table of CAP alerts (date range, district, disaster type,
// status). Rows expand to the per-station delivery detail — the
// station-wise broadcast certificate content — and the whole filtered
// view exports as CSV for DDMA/MIB reporting.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AudioLines,
  ChevronDown,
  ChevronRight,
  Download,
  FileDown,
  Loader2,
  RefreshCw,
  ScrollText,
} from "lucide-react";

interface Delivery {
  stationName: string;
  strategy: string;
  status: string;
  responseCode: number | null;
  responseBody: string | null;
  broadcastTime: string | null;
  retryCount: number;
  externalRef: string | null;
}

interface HistoryAlert {
  id: string;
  alertId: string;
  capHash: string | null;
  createdAt: string;
  language: string | null;
  severity: string | null;
  status: string;
  audioUrl: string | null;
  district: string | null;
  disasterType: string | null;
  stationsReached: number;
  failed: number;
  deliveries: Delivery[];
}

const DISASTER_TYPES = ["flood", "cyclone", "earthquake", "heatwave"];
const STATUSES = ["pending", "sent", "delivered", "failed"];

function severityBadge(severity: string | null) {
  if (!severity) return null;
  const tone =
    severity === "Extreme" || severity === "Severe"
      ? "bg-red-500/10 text-red-400"
      : "bg-amber-500/10 text-amber-300";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${tone}`}>
      {severity}
    </span>
  );
}

function statusDot(status: string) {
  const tone: Record<string, string> = {
    delivered: "bg-emerald-400",
    sent: "bg-sky-400",
    pending: "bg-amber-400",
    failed: "bg-red-400",
  };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${tone[status] ?? "bg-slate-500"}`} />
      {status}
    </span>
  );
}

const CSV_HEADER = [
  "alert_id",
  "time",
  "district",
  "disaster_type",
  "severity",
  "status",
  "language",
  "station",
  "channel",
  "delivery_status",
  "response_code",
  "broadcast_time",
  "retries",
];

/** Quote a CSV cell and neutralise spreadsheet formula injection. */
function csvCell(value: unknown): string {
  let text = String(value ?? "");
  // = + - @ at the start of a cell can execute as a formula in Excel —
  // prefix with a quote so DDMA/MIB staff can open the report safely.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** One row per station delivery — the station-wise broadcast certificate. */
function toCsv(rows: HistoryAlert[]): string {
  const lines = [CSV_HEADER.map((h) => csvCell(h)).join(",")];
  for (const r of rows) {
    const base = [
      r.alertId,
      r.createdAt,
      r.district ?? "",
      r.disasterType ?? "",
      r.severity ?? "",
      r.status,
      r.language ?? "",
    ];
    if (r.deliveries.length === 0) {
      lines.push([...base, "—", "—", "no attempts", "—", "—", "0"].map(csvCell).join(","));
      continue;
    }
    for (const d of r.deliveries) {
      lines.push(
        [
          ...base,
          d.stationName,
          d.strategy,
          d.status,
          d.responseCode ?? "",
          d.broadcastTime ?? "",
          String(d.retryCount),
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return lines.join("\n");
}

export default function FmBroadcastHistory() {
  const [alerts, setAlerts] = useState<HistoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 3600_000).toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [district, setDistrict] = useState("");
  const [disasterType, setDisasterType] = useState("");
  const [status, setStatus] = useState("");

  /** Current filter set as query params (shared by the table + exports). */
  const filterParams = useCallback(() => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", new Date(`${startDate}T00:00:00`).toISOString());
    if (endDate) params.set("endDate", new Date(`${endDate}T23:59:59`).toISOString());
    if (district.trim()) params.set("district", district.trim());
    if (disasterType) params.set("disasterType", disasterType);
    if (status) params.set("status", status);
    return params;
  }, [startDate, endDate, district, disasterType, status]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterParams();

      const res = await fetch(`/api/broadcast/fm/history?${params.toString()}`);
      const data = (await res.json()) as { ok: boolean; alerts?: HistoryAlert[] };
      if (!res.ok || !data.ok) {
        toast.error("Failed to load broadcast history.");
        setAlerts([]);
      } else {
        setAlerts(data.alerts ?? []);
      }
    } catch (error: unknown) {
      console.error("Failed to load broadcast history:", error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [filterParams]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  /**
   * Open the print-ready DDMA/MIB report for the current filters in a new
   * tab. The export HTML auto-triggers the browser's print dialog
   * (Save as PDF); the floating button in the tab re-opens it anytime.
   */
  function exportPdf() {
    const url = `/api/broadcast/fm/export/pdf?${filterParams().toString()}&autoprint=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function exportCsv() {
    if (alerts.length === 0) {
      toast.error("Nothing to export.");
      return;
    }
    const blob = new Blob([toCsv(alerts)], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `fm-broadcast-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Exported ${alerts.length} broadcast record${alerts.length === 1 ? "" : "s"}.`);
  }

  const inputClass =
    "rounded-md border border-panel-border bg-primary px-3 py-2 text-sm text-foreground outline-none transition focus:border-amber-400/50";
  const labelClass = "text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------ Filter bar */}
      <div className="rounded-lg border border-panel-border bg-panel p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>From</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>To</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>District</span>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Patna"
              className={`${inputClass} w-40`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Disaster type</span>
            <select value={disasterType} onChange={(e) => setDisasterType(e.target.value)} className={inputClass}>
              <option value="">All</option>
              {DISASTER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchHistory()}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-3.5 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/25"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Apply
            </button>
            <button
              type="button"
              onClick={exportPdf}
              disabled={alerts.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-primary px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:border-sky-500/50 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-40"
              title="Open the print-ready DDMA/MIB report for these filters"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={alerts.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-primary px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ History table */}
      {loading && alerts.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-panel-border text-center">
          <ScrollText className="mb-2 h-8 w-8 text-slate-600" />
          <p className="text-sm text-slate-500">No broadcasts match these filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-panel-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary text-[0.6875rem] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2.5 pl-4 pr-2 font-semibold" />
                <th className="py-2.5 pr-3 font-semibold">Alert ID</th>
                <th className="py-2.5 pr-3 font-semibold">Time</th>
                <th className="py-2.5 pr-3 font-semibold">District</th>
                <th className="py-2.5 pr-3 font-semibold">Type</th>
                <th className="py-2.5 pr-3 font-semibold">Severity</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Reached</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Failed</th>
                <th className="py-2.5 pr-4 font-semibold">Audio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c2740]">
              {alerts.map((alert) => {
                const expanded = expandedId === alert.id;
                return (
                  <HistoryRow
                    key={alert.id}
                    alert={alert}
                    expanded={expanded}
                    onToggle={() => setExpandedId(expanded ? null : alert.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600">
        {alerts.length} record{alerts.length === 1 ? "" : "s"} · station delivery rows are the
        broadcast certificates used for DDMA/MIB reporting · audio retained 90 days.
      </p>
    </div>
  );
}

function HistoryRow({
  alert,
  expanded,
  onToggle,
}: {
  alert: HistoryAlert;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`cursor-pointer transition hover:bg-secondary ${expanded ? "bg-secondary" : ""}`}
        onClick={onToggle}
      >
        <td className="py-3 pl-4 pr-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-amber-300" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </td>
        <td className="py-3 pr-3 font-mono text-xs text-sky-300">{alert.alertId}</td>
        <td className="py-3 pr-3 text-slate-300">
          {new Date(alert.createdAt).toLocaleString("en-IN")}
        </td>
        <td className="py-3 pr-3 font-medium text-foreground">{alert.district ?? "—"}</td>
        <td className="py-3 pr-3 capitalize text-slate-300">{alert.disasterType ?? "—"}</td>
        <td className="py-3 pr-3">{severityBadge(alert.severity)}</td>
        <td className="py-3 pr-3 text-right font-semibold text-emerald-300">
          {alert.stationsReached}
        </td>
        <td className="py-3 pr-3 text-right font-semibold text-red-400">{alert.failed}</td>
        <td className="py-3 pr-4">
          {alert.audioUrl ? (
            <a
              href={alert.audioUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-sky-300 transition hover:text-sky-200"
              title="Open archived alert audio"
            >
              <AudioLines className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-slate-600">—</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-panel-deep">
          <td colSpan={9} className="px-4 py-4">
            {/* Station-wise certificate */}
            <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-amber-300">
              Station delivery certificate · {alert.deliveries.length} attempt
              {alert.deliveries.length === 1 ? "" : "s"}
              {alert.capHash ? ` · cap sha256 ${alert.capHash.slice(0, 12)}…` : ""}
            </p>
            {alert.deliveries.length === 0 ? (
              <p className="text-sm text-slate-500">No delivery attempts were logged.</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="text-[0.625rem] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-1.5 pr-3 font-semibold">Station</th>
                    <th className="py-1.5 pr-3 font-semibold">Channel</th>
                    <th className="py-1.5 pr-3 font-semibold">Status</th>
                    <th className="py-1.5 pr-3 font-semibold">Response</th>
                    <th className="py-1.5 pr-3 font-semibold">Broadcast time</th>
                    <th className="py-1.5 font-semibold">Retries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#16203a]">
                  {alert.deliveries.map((d, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 font-medium text-slate-200">{d.stationName}</td>
                      <td className="py-2 pr-3 uppercase text-slate-400">{d.strategy}</td>
                      <td className="py-2 pr-3">{statusDot(d.status)}</td>
                      <td className="py-2 pr-3 font-mono text-slate-400">{d.responseCode ?? "—"}</td>
                      <td className="py-2 pr-3 text-slate-400">
                        {d.broadcastTime ? new Date(d.broadcastTime).toLocaleString("en-IN") : "—"}
                      </td>
                      <td className="py-2 text-slate-400">{d.retryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
