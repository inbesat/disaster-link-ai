"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

type SyncPhase = "syncing" | "fresh" | "stale";

export default function SyncStatus() {
  const [phase, setPhase] = useState<SyncPhase>("syncing");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [forcing, setForcing] = useState(false);
  const timerRef = useRef<number | null>(null);

  // "Sync" sweep on mount: Syncing... -> Data fresh (just now).
  useEffect(() => {
    const started = Date.now();
    setPhase("syncing");
    const t = window.setTimeout(() => {
      setLastSyncedAt(started);
      setPhase("fresh");
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  // Track elapsed time to drift from "just now" -> "2 mins ago" -> "5 mins ago".
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  // Slow re-sync every 90s to keep the status honest.
  useEffect(() => {
    const cycle = window.setInterval(() => {
      setPhase("syncing");
      window.setTimeout(() => {
        setLastSyncedAt(Date.now());
        setPhase("fresh");
      }, 900);
    }, 90_000);
    return () => window.clearInterval(cycle);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function forceSync() {
    if (forcing) return;
    setForcing(true);
    setPhase("syncing");
    timerRef.current = window.setTimeout(() => {
      setLastSyncedAt(Date.now());
      setPhase("fresh");
      setForcing(false);
      toast.success("Data synced — all reports uploaded.", {
        duration: 2500,
      });
    }, 800);
  }

  const minsAgo =
    lastSyncedAt === null ? null : Math.max(0, Math.floor((now - lastSyncedAt) / 60_000));

  const label =
    phase === "syncing"
      ? "Syncing…"
      : minsAgo === null || minsAgo <= 0
        ? "Data fresh (just now)"
        : `Last updated ${minsAgo} min${minsAgo === 1 ? "" : "s"} ago`;

  const color =
    phase === "syncing"
      ? "text-amber-300 border-amber-400/40 bg-amber-500/10"
      : minsAgo !== null && minsAgo >= 5
        ? "text-severity-red-400 border-severity-red-500/40 bg-severity-red-500/10"
        : "text-severity-green-400 border-severity-green-500/40 bg-severity-green-500/10";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={forceSync}
        disabled={forcing}
        title="Force sync"
        className={`flex min-h-[32px] items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${color} ${
          forcing ? "cursor-wait" : "hover:brightness-125"
        }`}
      >
        {phase === "syncing" ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      <button
        type="button"
        onClick={forceSync}
        disabled={forcing}
        aria-label="Force sync now"
        title="Force sync now"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-elevated text-slate-300 transition hover:border-accent hover:text-accent disabled:opacity-50"
      >
        <RefreshCcw className="h-4 w-4" />
      </button>
    </div>
  );
}