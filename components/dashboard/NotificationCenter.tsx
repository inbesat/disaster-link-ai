"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { acknowledgeAlert } from "@/app/actions/alerts";

type AlertItem = {
  id: string;
  severity: string;
  channel: string;
  message: string;
  district: string | null;
  isAcknowledged: boolean;
  createdAt: string;
};

const SEVERITY_STYLE: Record<string, { chip: string; panel: string; border: string }> = {
  critical: {
    chip: "bg-severity-red-600 text-white",
    panel: "bg-severity-red-600/10",
    border: "border-severity-red-600",
  },
  warning: {
    chip: "bg-severity-amber-600 text-slate-950",
    panel: "bg-severity-amber-600/10",
    border: "border-severity-amber-600",
  },
  // watch / safe / anything else → neutral info styling.
  info: {
    chip: "bg-surface-elevated text-slate-300",
    panel: "bg-surface-muted",
    border: "border-border",
  },
};

function styleFor(severity: string) {
  return SEVERITY_STYLE[severity] ?? SEVERITY_STYLE.info;
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const loadAlerts = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/alerts?limit=20", { signal });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      if (!signal?.aborted) {
        setAlerts(data.alerts ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== "AbortError") {
        console.error("Failed to load alerts:", error);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch on mount and whenever the dropdown opens.
  useEffect(() => {
    const controller = new AbortController();
    void loadAlerts(controller.signal);
    return () => controller.abort();
  }, [loadAlerts]);

  useEffect(() => {
    if (open) void loadAlerts();
  }, [open, loadAlerts]);

  // Close the dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Optimistic acknowledge via the server action: update the UI immediately,
  // revert if the call fails.
  function acknowledge(id: string) {
    const previous = alerts;
    setAlerts((list) =>
      list.map((alert) => (alert.id === id ? { ...alert, isAcknowledged: true } : alert)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    void acknowledgeAlert(id).then((result) => {
      if (!result.ok) {
        setAlerts(previous);
        setUnreadCount((count) => count + 1);
        console.error("Acknowledge failed:", result.error);
      }
    });
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-elevated p-2.5 text-foreground transition hover:border-accent hover:text-accent"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-severity-red-600 px-1 text-eoc-tiny font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-eoc border border-border bg-surface shadow-glow-accent">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="eoc-label text-accent">ALERT CENTER</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-md p-2 text-slate-400 transition hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <ul className="max-h-96 overflow-y-auto">
            {loading && alerts.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                Loading alerts…
              </li>
            )}

            {!loading && alerts.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-slate-500">
                No alerts yet.
              </li>
            )}

            {alerts.map((alert) => {
              const style = styleFor(alert.severity);
              return (
                <li
                  key={alert.id}
                  onClick={() => {
                    if (!alert.isAcknowledged) void acknowledge(alert.id);
                  }}
                  className={`cursor-pointer border-l-2 ${style.border} ${style.panel} px-4 py-3 transition hover:brightness-110`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-eoc-tiny font-bold uppercase ${style.chip}`}
                    >
                      {alert.severity}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!alert.isAcknowledged && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            acknowledge(alert.id);
                          }}
                          title="Mark as read / Acknowledge"
                          aria-label="Acknowledge alert"
                          className="rounded-md border border-severity-green-600 bg-severity-green-600/10 p-1 text-severity-green-400 transition hover:bg-severity-green-600 hover:text-slate-950"
                        >
                          <CheckmarkIcon />
                        </button>
                      )}
                      <span className="text-eoc-tiny text-slate-500">
                        {timeAgo(alert.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{alert.message}</p>
                  <p className="mt-1 text-eoc-tiny uppercase tracking-wider text-slate-500">
                    {alert.district ?? "Unknown district"} · {alert.channel}
                    {!alert.isAcknowledged && (
                      <span className="ml-2 text-severity-red-400">● unread</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function CheckmarkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
