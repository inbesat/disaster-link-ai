"use client";

import { useEffect, useState } from "react";
import { CloudSync, CloudAlert, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { OfflineSyncQueue, subscribeToNetwork } from "@/lib/field-offline";

export default function SyncStatusBadge() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const updatePending = () => setPending(OfflineSyncQueue.count());
    const unsub = subscribeToNetwork(() => setOnline(Boolean(navigator.onLine)));

    updatePending();
    window.addEventListener("drip:pending", updatePending);
    return () => {
      unsub();
      window.removeEventListener("drip:pending", updatePending);
    };
  }, []);

  async function flush() {
    if (pending === 0 || busy) return;
    setBusy(true);
    try {
      const res = await OfflineSyncQueue.syncAll();
      // drive pending via: 0 if queue empty after sync
      setPending(OfflineSyncQueue.count());
      if (res.synced > 0) {
        // brief "syncing" then success
        toast.success("All offline reports successfully uploaded to Control Room!");
      } else {
        toast("0 updates to flush.", { icon: "✅" });
      }
    } finally {
      setBusy(false);
    }
  }

  const amber = !online || (online && pending > 0);

  return (
    <button
      type="button"
      onClick={() => void flush()}
      disabled={!amber || busy}
      aria-live="polite"
      className={`fixed bottom-20 right-3 z-[45] flex min-h-[48px] items-center gap-2 rounded-full border-2 px-4 text-base font-bold shadow-lg transition ${
        online && pending === 0
          ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
          : "border-amber-400 bg-amber-500/15 text-amber-300"
      } ${amber && !busy ? "active:scale-95" : "cursor-default"}`}
    >
      {online && pending === 0 ? (
        <CheckCircle2 className="h-6 w-6" />
      ) : (
        <span className="relative flex h-6 w-6 items-center justify-center">
          {busy ? (
            <CloudSync className="h-6 w-6 animate-spin" />
          ) : (
            <CloudAlert className="h-6 w-6 animate-pulse" />
          )}
        </span>
      )}
      <span>
        {!online
          ? "Syncing…"
          : pending > 0
            ? `${pending} Unsynced Report${pending === 1 ? "" : "s"}`
            : "Synced"}
      </span>
    </button>
  );
}