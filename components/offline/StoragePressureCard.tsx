"use client";

// ---------------------------------------------------------------------
// components/offline/StoragePressureCard.tsx — Phase 9 · Step 4
// Storage pressure handler UI. Checks the live browser quota on mount and
// when storage events fire, and when usage is critically high shows a
// warning card with one-tap actions that free real bytes:
//
//   • Clear cached map tiles   (evictLruMapTiles to 0)
//   • Reduce chat history      (drop oldest half)
//   • (if persistent storage not granted) "Make storage persistent"
//
// Actions call run() and re-evaluate, so the card disappears once usage
// drops back under the warning threshold. SSR-safe — renders null outside
// a browser and when there is nothing to report.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Eraser, History, RefreshCw } from "lucide-react";
import { getOfflineDb } from "@/lib/offline-sync/db";
import {
  evaluateStoragePressure,
  listFreeUpActions,
  type FreeUpAction,
  type StoragePressureLevel,
} from "@/lib/offline-sync/storage-pressure";
import { checkStorageQuota, requestPersistence, formatBytes } from "@/lib/offline-sync/quota";

const LEVEL_STYLES: Record<
  StoragePressureLevel,
  { card: string; badge: string; label: string }
> = {
  ok: {
    card: "border-emerald-400/30 bg-emerald-400/5",
    badge: "bg-emerald-400/15 text-emerald-300",
    label: "Storage OK",
  },
  warning: {
    card: "border-amber-400/30 bg-amber-400/5",
    badge: "bg-amber-400/15 text-amber-300",
    label: "Storage nearly full",
  },
  critical: {
    card: "border-red-400/40 bg-red-400/5",
    badge: "bg-red-400/15 text-red-300",
    label: "Storage critical",
  },
};

const ACTION_ICONS: Record<string, typeof Eraser> = {
  "clear-tiles": Eraser,
  "reduce-history": History,
};

export function StoragePressureCard() {
  const [level, setLevel] = useState<StoragePressureLevel>("ok");
  const [message, setMessage] = useState<string>("");
  const [freeBytes, setFreeBytes] = useState<number>(0);
  const [usageFraction, setUsageFraction] = useState<number>(0);
  const [persisted, setPersisted] = useState<boolean>(false);
  const [actions, setActions] = useState<FreeUpAction[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [lastFreed, setLastFreed] = useState<string | null>(null);

  const check = useCallback(async () => {
    const db = typeof indexedDB === "undefined" ? null : getOfflineDb();
    const snapshot = await checkStorageQuota();
    const pressure = await evaluateStoragePressure(snapshot);
    const availableActions = await listFreeUpActions(db);
    setLevel(pressure.level);
    setMessage(pressure.message);
    setFreeBytes(pressure.freeBytes);
    setUsageFraction(pressure.usageFraction);
    setPersisted(pressure.persisted);
    setActions(availableActions);
  }, []);

  useEffect(() => {
    void check();
    const refresh = () => void check();
    window.addEventListener("storage", refresh);
    // Re-run after the model download / purge changes the cache.
    window.addEventListener("drip:model:state", refresh);
    window.addEventListener("drip:model:progress", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("drip:model:state", refresh);
      window.removeEventListener("drip:model:progress", refresh);
    };
  }, [check]);

  const runAction = async (action: FreeUpAction) => {
    setRunning(action.id);
    setLastFreed(null);
    try {
      const freed = await action.run();
      setLastFreed(formatBytes(freed));
      await check();
    } finally {
      setRunning(null);
    }
  };

  const handlePersist = async () => {
    const granted = await requestPersistence();
    if (granted) await check();
  };

  if (level === "ok") return null;

  const styles = LEVEL_STYLES[level];
  const pct = Math.round(usageFraction * 100);

  return (
    <div
      role="alert"
      className={`fixed left-1/2 top-3 z-40 w-[min(94vw,620px)] -translate-x-1/2 rounded-xl border p-4 shadow-lg shadow-black/30 backdrop-blur-md ${styles.card}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="h-4 w-4 text-amber-300" />
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles.badge}`}>
            {styles.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void check()}
          aria-label="Refresh storage check"
          className="rounded-md p-1 text-muted-foreground transition hover:bg-white/5"
        >
          <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>

      <p className="mt-2 text-sm leading-relaxed">{message}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {pct}% of browser quota used · {formatBytes(freeBytes)} free
      </p>

      {actions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {actions.map((action) => {
            const Icon = ACTION_ICONS[action.id] ?? Check;
            const isRunning = running === action.id;
            return (
              <button
                key={action.id}
                type="button"
                disabled={isRunning}
                onClick={() => void runAction(action)}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10 disabled:opacity-60"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {action.label}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {isRunning
                    ? "Freeing…"
                    : action.estimateBytes > 0
                      ? `~${formatBytes(action.estimateBytes)}`
                      : "Free space"}
                </span>
              </button>
            );
          })}

          {!persisted && (
            <button
              type="button"
              onClick={() => void handlePersist()}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Check aria-hidden="true" className="h-4 w-4" />
                Make storage persistent
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">Stop auto-eviction</span>
            </button>
          )}
        </div>
      )}

      {lastFreed && (
        <p className="mt-2 text-xs text-emerald-300">Freed {lastFreed}. ✓</p>
      )}
    </div>
  );
}

export default StoragePressureCard;