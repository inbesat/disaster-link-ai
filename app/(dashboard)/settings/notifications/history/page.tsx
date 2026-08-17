"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Clock, Filter, Mail, MessageSquare, Smartphone } from "lucide-react";

type NotificationRecord = {
  id: string;
  type: "flood_alert" | "evacuation" | "resource" | "system";
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  channels: string[];
  status: "delivered" | "read" | "failed";
  minutesAgo: number;
};

// Relative timestamps (not absolute ISO strings): the client computes the
// displayed "Xm ago" from a mounted clock, so the server and client render
// the same HTML and there is no hydration mismatch.
const MOCK_HISTORY: NotificationRecord[] = [
  {
    id: "nh-1",
    type: "flood_alert",
    severity: "critical",
    title: "Flash Flood Warning — Patna",
    message: "Brahmaputra at Kamrup is 0.9m above danger mark. Evacuate low-lying wards.",
    channels: ["push", "sms", "in_app"],
    status: "delivered",
    minutesAgo: 30,
  },
  {
    id: "nh-2",
    type: "evacuation",
    severity: "warning",
    title: "Evacuation Order — Rajendra Nagar",
    message: "Immediate evacuation required. Proceed to Central Community Hall via NH-31.",
    channels: ["push", "in_app"],
    status: "read",
    minutesAgo: 120,
  },
  {
    id: "nh-3",
    type: "resource",
    severity: "info",
    title: "Resource Deployed",
    message: "4 NDRF Rescue Boats dispatched to Rajendra Nagar flood zone. ETA 1.5 hrs.",
    channels: ["in_app"],
    status: "delivered",
    minutesAgo: 300,
  },
  {
    id: "nh-4",
    type: "flood_alert",
    severity: "warning",
    title: "Heavy Rainfall Forecast — Patna",
    message: "Waterlogging expected in low-lying areas. Stay alert.",
    channels: ["push", "in_app"],
    status: "delivered",
    minutesAgo: 480,
  },
  {
    id: "nh-5",
    type: "system",
    severity: "info",
    title: "Daily Digest Available",
    message: "Your daily summary of 12 notifications is ready to view.",
    channels: ["in_app"],
    status: "read",
    minutesAgo: 1440,
  },
];

const CHANNEL_ICONS: Record<string, typeof Bell> = {
  in_app: Bell,
  push: Smartphone,
  sms: MessageSquare,
  email: Mail,
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  delivered: "text-emerald-400",
  read: "text-blue-400",
  failed: "text-red-400",
};

function timeAgo(minutesAgo: number): string {
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hrs = Math.floor(minutesAgo / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationHistoryPage() {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "delivered" | "read" | "failed">("all");
  // `mounted` gates all time-dependent rendering: until the client hydrates,
  // relative labels stay blank so server and client HTML always match.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = MOCK_HISTORY.filter((n) => {
    if (filter !== "all" && n.severity !== filter) return false;
    if (statusFilter !== "all" && n.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notification History</h1>
        <p className="mt-1 text-sm text-muted">
          30-day archive of all notifications sent to you, with delivery status.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Filter className="h-4 w-4" />
          <span>Filter:</span>
        </div>
        {(["all", "critical", "warning", "info"] as const).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
              filter === level
                ? "border-accent bg-accent/15 text-accent"
                : "border-subtle bg-secondary text-slate-400 hover:text-slate-200"
            }`}
          >
            {level}
          </button>
        ))}
        <div className="mx-2 h-4 w-px bg-subtle" />
        {(["all", "delivered", "read", "failed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
              statusFilter === s
                ? "border-accent bg-accent/15 text-accent"
                : "border-subtle bg-secondary text-slate-400 hover:text-slate-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* History list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="rounded-lg border border-subtle bg-secondary/50 p-8 text-center text-sm text-muted">
            No notifications match the current filters.
          </div>
        )}
        {filtered.map((notification) => (
          <div
            key={notification.id}
            className="flex flex-col gap-2 rounded-lg border border-subtle bg-secondary/50 p-4 transition hover:border-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${SEVERITY_STYLES[notification.severity]}`}
                  >
                    {notification.severity}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {notification.title}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{notification.message}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="h-3 w-3" />
                  {mounted ? timeAgo(notification.minutesAgo) : "—"}
                </span>
                <span className={`text-xs font-medium capitalize ${STATUS_STYLES[notification.status]}`}>
                  {notification.status === "read" ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-3 w-3" /> Read
                    </span>
                  ) : (
                    notification.status
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">Channels:</span>
              <div className="flex items-center gap-1.5">
                {notification.channels.map((ch) => {
                  const Icon = CHANNEL_ICONS[ch] ?? Bell;
                  return (
                    <span
                      key={ch}
                      className="flex items-center gap-1 rounded bg-tertiary px-1.5 py-0.5 text-[10px] text-slate-300"
                    >
                      <Icon className="h-3 w-3" />
                      {ch.replace("_", " ")}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
