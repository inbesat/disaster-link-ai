"use client";

import { useMemo, useState } from "react";
import { BellOff } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import SeverityBadge from "@/components/ui/SeverityBadge";

export type AlertHistoryRow = {
  id: string;
  severity: string;
  channel: string;
  message: string;
  district: string | null;
  isAcknowledged: boolean;
  acknowledgedBy: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
};

type SeverityFilter = "all" | "critical" | "warning" | "info";
type StatusFilter = "all" | "acknowledged" | "unread";
type ChannelFilter = "all" | "sms" | "push" | "in_app" | "email";
type DistrictFilter = "all" | string;

const SEVERITY_OPTIONS: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "All Severities" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "unread", label: "Unread" },
];

const CHANNEL_OPTIONS: { value: ChannelFilter; label: string }[] = [
  { value: "all", label: "All Channels" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push" },
  { value: "in_app", label: "In-App" },
  { value: "email", label: "Email" },
];

function bucket(severity: string): "critical" | "warning" | "info" {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "info";
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AlertHistoryTable({ alerts }: { alerts: AlertHistoryRow[] }) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [districtFilter, setDistrictFilter] = useState<DistrictFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const districts = useMemo(
    () =>
      Array.from(
        new Set(alerts.map((a) => a.district).filter((d): d is string => Boolean(d))),
      ),
    [alerts],
  );

  const filtered = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return alerts.filter((alert) => {
      const severityMatch =
        severityFilter === "all" || bucket(alert.severity) === severityFilter;
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "acknowledged" ? alert.isAcknowledged : !alert.isAcknowledged);
      const channelMatch =
        channelFilter === "all" || alert.channel.toLowerCase() === channelFilter;
      const districtMatch = districtFilter === "all" || alert.district === districtFilter;

      const ts = new Date(alert.createdAt).getTime();
      const afterMatch = from === null || ts >= from;
      const beforeMatch = to === null || ts <= to;

      return (
        severityMatch &&
        statusMatch &&
        channelMatch &&
        districtMatch &&
        afterMatch &&
        beforeMatch
      );
    });
  }, [
    alerts,
    severityFilter,
    statusFilter,
    channelFilter,
    districtFilter,
    fromDate,
    toDate,
  ]);

  function clearDateFilters() {
    setFromDate("");
    setToDate("");
  }

  function clearAllFilters() {
    setSeverityFilter("all");
    setStatusFilter("all");
    setChannelFilter("all");
    setDistrictFilter("all");
    setFromDate("");
    setToDate("");
  }

  const unread = alerts.filter((alert) => !alert.isAcknowledged).length;

  return (
    <div className="eoc-panel overflow-hidden">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <label htmlFor="severity-filter" className="eoc-label">
            Severity
          </label>
          <select
            id="severity-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="eoc-label">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="channel-filter" className="eoc-label">
            Channel
          </label>
          <select
            id="channel-filter"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as ChannelFilter)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            {CHANNEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="district-filter" className="eoc-label">
            District
          </label>
          <select
            id="district-filter"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          >
            <option value="all">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="from-date" className="eoc-label">
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          <label htmlFor="to-date" className="eoc-label">
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
          />
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={clearDateFilters}
              className="text-[11px] font-semibold uppercase tracking-wider text-accent hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            {filtered.length} of {alerts.length} shown
          </span>
          <span className="rounded-full border border-severity-red-600 bg-severity-red-600/10 px-2.5 py-0.5 font-semibold text-severity-red-400">
            {unread} unread
          </span>
        </div>
      </div>

      {/* Dispatch log table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/60">
              <th className="eoc-label whitespace-nowrap px-5 py-3">TIMESTAMP</th>
              <th className="eoc-label whitespace-nowrap px-5 py-3">DISTRICT</th>
              <th className="eoc-label whitespace-nowrap px-5 py-3">SEVERITY</th>
              <th className="eoc-label px-5 py-3">MESSAGE</th>
              <th className="eoc-label whitespace-nowrap px-5 py-3">CHANNEL</th>
              <th className="eoc-label whitespace-nowrap px-5 py-3">ACKNOWLEDGED BY</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6">
                  <EmptyState
                    icon={BellOff}
                    title={
                      alerts.length === 0
                        ? "No alerts on record"
                        : "No alerts match the filters"
                    }
                    description={
                      alerts.length === 0
                        ? "Critical dispatches will appear here the moment the alert engine fires."
                        : "Nothing in the dispatch log matches the current severity, status, channel, district, or date filters."
                    }
                    actionButton={
                      alerts.length > 0 ? (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="rounded-md border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-accent transition hover:border-accent hover:bg-accent/10"
                        >
                          Clear Filters
                        </button>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            )}

            {filtered.map((alert) => {
              return (
                <tr
                  key={alert.id}
                  className={`border-b border-border/60 transition ${
                    !alert.isAcknowledged
                      ? "bg-surface-muted/30 hover:bg-surface-muted/60"
                      : "hover:bg-surface-muted/40"
                  }`}
                >
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-400">
                    {formatTimestamp(alert.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-medium">
                    {alert.district ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {/* Phase 22 · Step 5 — color + icon + text so severity
                        never relies on color alone (colorblind-safe). */}
                    <SeverityBadge variant={alert.severity} size="sm" />
                  </td>
                  <td className="max-w-md px-5 py-3 text-slate-300">{alert.message}</td>
                  <td className="whitespace-nowrap px-5 py-3 uppercase text-[11px] tracking-wider text-slate-400">
                    {alert.channel}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3">
                    {alert.isAcknowledged ? (
                      <span className="inline-flex items-center gap-1.5 text-severity-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-severity-green-500" />
                        {alert.acknowledgedBy ?? "Unknown"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-severity-red-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-severity-red-500" />
                        Unread
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
