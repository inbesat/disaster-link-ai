"use client";

// ---------------------------------------------------------------------
// components/field/QuickStatusGrid.tsx — Phase 14 · Step 4.
//
// One-tap tactical status updates — no typing, gloved-finger friendly.
// A 2x3 grid of massive square thumb targets sits at the top of the
// Tasks page. Tapping one:
//   1. grabs the device's current GPS coordinates (Patna demo fallback
//      when the browser denies/omits location),
//   2. POSTs { status, timestamp, lat, lng, responder } to the mock
//      command-center endpoint /api/field/status,
//   3. offline → the update is queued via OfflineSyncQueue for replay,
//   4. shows a quick success toast + a light haptic.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import { LocateFixed, Check, TriangleAlert, Ban, Home, Package, MapPinned } from "lucide-react";
import { triggerLightHaptic, triggerHeavyHaptic } from "@/hooks/useHaptics";
import { OfflineSyncQueue, PATNA_CENTER } from "@/lib/field-offline";

const RESPONDER = "Sunita Das · Team Alpha · NDRF";

type StatusKey =
  | "arrived"
  | "complete"
  | "backup"
  | "road"
  | "shelter"
  | "resources";

const STATUSES: {
  key: StatusKey;
  label: string;
  sub: string;
  emoji: string;
  icon: typeof LocateFixed;
  tone: string;
}[] = [
  {
    key: "arrived",
    label: "Arrived at Location",
    sub: "GPS + status",
    emoji: "📍",
    icon: MapPinned,
    tone: "border-cyan-400/50 bg-cyan-500/10 text-cyan-300",
  },
  {
    key: "complete",
    label: "Task Complete",
    sub: "Mark done",
    emoji: "✅",
    icon: Check,
    tone: "border-emerald-400/50 bg-emerald-500/10 text-emerald-300",
  },
  {
    key: "backup",
    label: "Need Backup",
    sub: "Priority alert",
    emoji: "⚠️",
    icon: TriangleAlert,
    tone: "border-amber-400/50 bg-amber-500/10 text-amber-300",
  },
  {
    key: "road",
    label: "Road Blocked",
    sub: "Route hazard",
    emoji: "🚧",
    icon: Ban,
    tone: "border-orange-400/50 bg-orange-500/10 text-orange-300",
  },
  {
    key: "shelter",
    label: "Shelter Full",
    sub: "Capacity hit",
    emoji: "🏠",
    icon: Home,
    tone: "border-red-400/50 bg-red-500/10 text-red-300",
  },
  {
    key: "resources",
    label: "Request Resources",
    sub: "Boats · meds · food",
    emoji: "🎒",
    icon: Package,
    tone: "border-purple-400/50 bg-purple-500/10 text-purple-300",
  },
];

function readGps(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(PATNA_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(PATNA_CENTER),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  });
}

export default function QuickStatusGrid() {
  const [sending, setSending] = useState<StatusKey | null>(null);

  async function send(key: StatusKey, label: string, emoji: string) {
    if (sending) return;
    setSending(key);
    triggerLightHaptic();

    const coords = await readGps();
    const payload = {
      status: label,
      emoji,
      responder: RESPONDER,
      lat: coords.lat,
      lng: coords.lng,
      at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/field/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      triggerHeavyHaptic();
      toast.success(`${emoji} ${label} — sent to Command Center`);
    } catch {
      // Offline → queue for the auto-flush on reconnect.
      OfflineSyncQueue.enqueue({ url: "/api/field/status", method: "POST", body: payload });
      toast(`Offline — ${label} queued to sync`, { icon: "☁️" });
    } finally {
      setSending(null);
    }
  }

  return (
    <section aria-label="Quick status updates">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STATUSES.map(({ key, label, sub, emoji, icon: Icon, tone }) => (
          <button
            key={key}
            type="button"
            onClick={() => void send(key, label, emoji)}
            disabled={sending === key}
            aria-label={`${label} — ${sub}`}
            className={`flex min-h-[116px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-4 text-center transition active:scale-95 disabled:opacity-60 ${tone} ${
              sending === key ? "animate-pulse" : ""
            }`}
          >
            {sending === key ? (
              <LocateFixed className="h-7 w-7 animate-pulse" aria-hidden />
            ) : (
              <Icon className="h-7 w-7" aria-hidden />
            )}
            <span className="text-[0.9375rem] font-bold leading-tight">{emoji} {label}</span>
            <span className="text-[0.6875rem] font-semibold uppercase tracking-wider opacity-70">
              {sub}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-[0.6875rem] text-slate-500">
        One tap = status + live GPS to the Command Center
      </p>
    </section>
  );
}
