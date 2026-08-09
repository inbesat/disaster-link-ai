"use client";

// ---------------------------------------------------------------------
// components/dashboard/LiveClock.tsx
// UI/UX Phase 10 · Step 2 — ticking IST clock.
//
// Live "this is real-time" signal for the Command Center: the current
// Indian Standard Time (Asia/Kolkata — UTC+05:30), re-read every second
// via setInterval, rendered as "HH:MM:SS AM/PM IST".
//
//   • Seconds are muted (--text-muted) so the tick doesn't fight the
//     headline KPI numbers for attention.
//   • SSR-safe — a wall-clock value can never match across the server and
//     client renders, so the component shows a static "--:--:-- -- IST"
//     placeholder on both sides and swaps to live time the moment the
//     mount effect runs.
//   • role="timer" with no live region — the tick must NOT be announced
//     by screen readers 60× a minute.
//
// Styling mirrors the Command Center header slab (slate literals rather
// than roadmap tokens) because that header intentionally does NOT re-theme
// in day-ops mode — see DashboardHeader's design note.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";

/** IST formatter — created once per page, reused every tick. */
const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h12",
});

type IstParts = {
  hour: string;
  minute: string;
  second: string;
  period: string;
};

function formatIstParts(date: Date): IstParts {
  const parts = IST_FORMATTER.formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const period = (parts.find((p) => p.type === "dayPeriod")?.value ?? "am").toUpperCase();
  return {
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
    period,
  };
}

type LiveClockProps = {
  className?: string;
  /**
   * Override the hardcoded time color. The hero header keeps the slab
   * literal `text-slate-100` (that header never re-themes), but theme-aware
   * bars (e.g. DashboardTopBar, which re-themes in day-ops) pass
   * `timeClassName="text-primary"` so the clock stays readable in light
   * mode. Only one text-* class is rendered — no cascade conflict.
   */
  timeClassName?: string;
};

export function LiveClock({ className = "", timeClassName }: LiveClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  // Tick every second; the interval is created after the first paint so the
  // initial render stays in sync with the placeholder. Also re-syncs the
  // moment the tab becomes visible again — background tabs throttle
  // intervals, so the clock could otherwise show stale time on return.
  useEffect(() => {
    const sync = () => setNow(new Date());
    sync();
    const id = window.setInterval(sync, 1000);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // Placeholder while unmounted-live (server + first client paint).
  if (!now) {
    return (
      <span
        aria-hidden
        className={`text-sm font-semibold tabular-nums tracking-wider text-muted ${className}`}
      >
        --:--:-- -- IST
      </span>
    );
  }

  const { hour, minute, second, period } = formatIstParts(now);

  return (
    <span
      role="timer"
      aria-label="Current time in Indian Standard Time"
      className={`inline-flex items-baseline text-sm font-semibold tabular-nums tracking-wider ${
        timeClassName ?? "text-slate-100"
      } ${className}`}
    >
      <span>
        {hour}:{minute}
      </span>
      <span className="text-muted">:{second}</span>
      <span> {period}</span>
      <span className="text-muted"> IST</span>
    </span>
  );
}

export default LiveClock;
