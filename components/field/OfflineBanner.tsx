"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi, RefreshCw, ShieldAlert } from "lucide-react";
import {
  OfflineSyncQueue,
  buildOfflineBundle,
  cacheBundle,
  getCachedBundle,
  isOnline,
  peekOfflineRisk,
  playAlarm,
  subscribeToNetwork,
} from "@/lib/field-offline";

const queueChangedEvent = "drip:pending";

const RISK_MSG: Record<string, string> = {
  Warning: "⚠️ WATER LEVEL RISING — Expect hazardous conditions in the coming hours.",
  Evacuate:
    "⚠️ EVACUATE NOW — Model predicts severe flooding hitting your area within the forecast window.",
};

export default function OfflineBanner() {
  const [online, setOnline] = useState(isOnline());
  const [pending, setPending] = useState(OfflineSyncQueue.count());
  const [syncing, setSyncing] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Boot: warm the 24h bundle + subscribe to network events + queue changes.
  useEffect(() => {
    void buildOfflineBundle().then(cacheBundle);
    const unsub = subscribeToNetwork(() => {
      const backOnline = isOnline();
      setOnline(backOnline);
      if (backOnline) void syncNow();
    });
    const onQueue = () => setPending(OfflineSyncQueue.count());
    window.addEventListener(queueChangedEvent, onQueue);
    window.addEventListener("storage", onQueue);
    return () => {
      unsub();
      window.removeEventListener(queueChangedEvent, onQueue);
      window.removeEventListener("storage", onQueue);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function syncNow() {
    setSyncing(true);
    const res = await OfflineSyncQueue.syncAll();
    setPending(res.remaining);
    setSyncing(false);
  }

  const risk = peekOfflineRisk(getCachedBundle(), 24);
  const critical = !acknowledged && !!risk && risk.level !== "Safe" && risk.level !== "Watch";

  const alarmBuzzed = useRef(false);
  useEffect(() => {
    if (!critical) {
      alarmBuzzed.current = false;
      return;
    }
    if (!alarmBuzzed.current) {
      alarmBuzzed.current = true;
      playAlarm();
    }
  }, [critical]);

  return (
    <>
      {/* Amber offline strip */}
      {!online && (
        <div className="relative z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b-2 border-amber-400/60 bg-amber-500 px-3 py-2 text-center">
          <WifiOff className="h-5 w-5 shrink-0 text-black" />
          <p className="text-[0.9375rem] font-bold text-black">
            ⚠️ OFFLINE MODE: Saving actions locally. Will auto-sync when connection is restored.
          </p>
          {pending > 0 && (
            <button
              type="button"
              onClick={() => {
                void syncNow();
              }}
              disabled={syncing}
              className="flex min-h-[48px] min-w-[48px] items-center justify-center gap-2 rounded-full bg-black px-5 text-[0.9375rem] font-bold text-amber-300 transition hover:opacity-90 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : `Sync Now (${pending} pending)`}
            </button>
          )}
        </div>
      )}

      {/* Post-reconnect reminder */}
      {online && pending > 0 && (
        <div className="relative z-30 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-center">
          <Wifi className="h-5 w-5 text-emerald-300" />
          <button
            type="button"
            onClick={() => {
              void syncNow();
            }}
            disabled={syncing}
            className="flex min-h-[48px] min-w-[48px] items-center gap-2 rounded-full border border-emerald-400 bg-emerald-500/15 px-5 text-[0.9375rem] font-bold text-emerald-200 transition hover:bg-emerald-500/25 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing offline changes…" : `Sync Now — ${pending} pending`}
          </button>
        </div>
      )}

      {/* In-app critical alarm (offline stand-in for SMS/push) */}
      {critical && risk && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-5">
          <div className="w-full max-w-md rounded-2xl border-2 border-red-500 bg-[#0d0b12] p-6 text-center shadow-[0_0_60px_rgba(239,68,68,0.5)]">
            <ShieldAlert className="mx-auto mb-3 h-14 w-14 animate-pulse text-red-500" />
            <p className="text-2xl font-black uppercase tracking-widest text-red-400">
              Critical Warning
            </p>
            <p className="text-lg text-red-200">{riskMsgWhen(risk.level)}</p>
            <p className="mt-2 text-base text-gray-400">
              Network unavailable — SMS alert could not be delivered. Heed this
              local alarm and move to a safe shelter now.
            </p>
            <div className="mt-4 space-y-1 text-left">
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">
                Nearest safe shelters
              </p>
              <SafeShelters />
            </div>
            <button
              type="button"
              onClick={() => setAcknowledged(true)}
              className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-emerald-400 bg-emerald-500/15 text-lg font-bold text-emerald-300 transition hover:bg-emerald-500/25"
            >
              I&apos;m Moving to Shelter — Acknowledge
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function riskMsgWhen(level: string) {
  return RISK_MSG[level] ?? RISK_MSG.Evacuate;
}

function SafeShelters() {
  const bundle = getCachedBundle();
  const safe = bundle?.shelters.filter((s) => s.safe && s.remaining > 0) ?? [];
  if (safe.length === 0)
    return <p className="text-sm text-gray-400">No open shelters cached — follow your evacuation plan.</p>;
  return (
    <ul className="space-y-1">
      {safe.map((s) => (
        <li key={s.id} className="text-base text-gray-200">
          • <span className="font-semibold text-emerald-300">{s.name}</span> —{" "}
          {s.remaining} spaces free ({s.district})
        </li>
      ))}
    </ul>
  );
}
