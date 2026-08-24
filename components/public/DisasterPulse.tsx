"use client";

// ---------------------------------------------------------------------
// components/public/DisasterPulse.tsx — Live Disaster Pulse widget.
//
// Read-only situational awareness for citizens, mounted in the public
// transparency panel: Indian disaster headlines (NewsData.io) + recent
// M4.5+ earthquakes (USGS). Each source degrades independently and the
// widget shows honest provenance (LIVE vs feed unavailable) rather than
// failing. Auto-refreshes every 5 minutes; data served via /api/pulse so
// API keys never reach the browser.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { Activity, Newspaper, RefreshCw } from "lucide-react";

type PulseNewsItem = { title: string; source: string; pubDate: string; link: string };
type PulseQuake = { place: string; magnitude: number; timeMs: number };

type PulsePayload = {
  ok?: boolean;
  news: { status: "live" | "unavailable"; items: PulseNewsItem[] };
  quakes: { status: "live" | "unavailable"; items: PulseQuake[] };
  fetchedAt: string;
};

function ago(isoOrMs: string | number): string {
  const t = typeof isoOrMs === "number" ? isoOrMs : Date.parse(isoOrMs);
  if (!Number.isFinite(t)) return "";
  const mins = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

function magTone(mag: number): string {
  if (mag >= 6) return "bg-red-500 text-white";
  if (mag >= 5) return "bg-amber-500 text-slate-950";
  return "bg-sky-500/80 text-white";
}

export function DisasterPulse() {
  const [data, setData] = useState<PulsePayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/pulse", { signal: AbortSignal.timeout(12_000) });
      const body = (await res.json().catch(() => null)) as PulsePayload | null;
      if (body?.ok) setData(body);
    } catch {
      // Keep last-known payload; status chips already signal staleness.
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5 * 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const anyLive =
    (data?.news.status === "live" && data.news.items.length > 0) ||
    (data?.quakes.status === "live" && data.quakes.items.length > 0);

  return (
    <section
      aria-label="Live disaster pulse"
      className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
            <Activity aria-hidden="true" className="h-[18px] w-[18px] text-[var(--dl-orange-light)]" />
          </span>
          <div>
            <p className="text-base font-bold text-white">Disaster Pulse</p>
            <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[var(--dl-text-muted)]">
              India headlines · world quakes
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider ${
            anyLive
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${anyLive ? "animate-pulse bg-emerald-400" : "bg-slate-500"}`}
            aria-hidden
          />
          {anyLive ? "Live" : "Idle"}
        </span>
      </div>

      {!data ? (
        /* Loading skeleton */
        <div className="mt-3 animate-pulse space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-white/[0.06]" />
          ))}
          <span className="sr-only">Loading live disaster updates…</span>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Headlines */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-widest text-slate-400">
              <Newspaper className="h-3 w-3" aria-hidden /> Headlines
              {data.news.status === "unavailable" && (
                <span className="font-medium normal-case tracking-normal text-slate-500">· feed unavailable</span>
              )}
            </p>
            {data.news.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-slate-500">
                No headlines right now.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {data.news.items.slice(0, 4).map((n) => (
                  <li key={n.link || n.title}>
                    <a
                      href={n.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 transition hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-200">{n.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[0.5625rem] uppercase tracking-wider text-slate-500">
                        <span className="rounded-sm bg-white/10 px-1 font-semibold">{n.source}</span>
                        {n.pubDate && ago(n.pubDate)}
                      </p>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Earthquakes */}
          <div>
            <p className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-widest text-slate-400">
              Earthquakes · USGS
              {data.quakes.status === "unavailable" && (
                <span className="font-medium normal-case tracking-normal text-slate-500"> · feed unavailable</span>
              )}
            </p>
            {data.quakes.items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-slate-500">
                No M4.5+ quakes in the last 24h.
              </p>
            ) : (
              <ul className="space-y-1">
                {data.quakes.items.map((q) => (
                  <li key={`${q.place}-${q.timeMs}`} className="flex items-center gap-2.5">
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-black tabular-nums ${magTone(q.magnitude)}`}>
                      M{q.magnitude.toFixed(1)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{q.place}</span>
                    <span className="shrink-0 text-[0.5625rem] uppercase tracking-wider text-slate-500">{ago(q.timeMs)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer meta */}
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="flex w-full items-center justify-center gap-1.5 border-t border-white/10 pt-2 text-[0.625rem] font-semibold uppercase tracking-wider text-slate-500 transition hover:text-slate-300 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            {refreshing ? "Refreshing…" : `Updated ${ago(data.fetchedAt)} · refresh`}
          </button>
        </div>
      )}
    </section>
  );
}

export default DisasterPulse;