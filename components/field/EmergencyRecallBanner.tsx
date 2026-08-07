"use client";

import { useEffect, useRef, useState } from "react";
import { Radio, ShieldCheck, Megaphone, X } from "lucide-react";
import toast from "react-hot-toast";
import { playAlarm } from "@/lib/field-offline";

const BROADCAST_KEY = "drip_emergency_broadcast_v1";

type Broadcast = {
  id: string;
  title: string;
  message: string;
  sector: string;
  sentAt: string;
};

export default function EmergencyRecallBanner() {
  const [active, setActive] = useState<Broadcast | null>(null);
  const chime = playChime;
  const ackId = useRef<string | null>(null);

  // Poll a mock command-room broadcast endpoint (simulated dispatch).
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/field/broadcast");
        const data = (await res.json()) as {
          broadcast?: Broadcast;
          lastId?: string;
        };
        if (cancelled) return;
        if (data.broadcast && data.broadcast.id !== ackId.current) {
          // New un-acknowledged critical broadcast → raise the full-screen alert.
          ackId.current = data.broadcast.id;
          setActive(data.broadcast);
          playAlarm();
        }
      } catch {
        // Command center offline — rely on locally seeded broadcast (below).
      }
    };
    check();
    const timer = window.setInterval(check, 6000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  // Standby seed: if a previous recall is still open, keep it visible.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BROADCAST_KEY);
      if (raw) setActive(JSON.parse(raw) as Broadcast);
    } catch {
      /* ignore */
    }
  }, []);

  // Allow a footer "test dispatch" button to trigger recall via a custom
  // event. The event may carry the server-issued broadcast (from the recall
  // dispatch API) so this device flashes the same id the poll will return.
  useEffect(() => {
    const onTest = (e: Event) => {
      const detail = (e as CustomEvent<Broadcast | undefined>).detail;
      recallNow(detail);
    };
    window.addEventListener("drip:recall-test", onTest);
    return () => window.removeEventListener("drip:recall-test", onTest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function recallNow(existing?: Broadcast) {
    const b: Broadcast = existing ?? {
      id: `recall-${Date.now()}`,
      title: "EMERGENCY RECALL ORDER",
      message:
        "🛑 IMMEDIATE EVACUATION ORDER: Flash flood warning in your sector. Move to higher ground immediately.",
      sector: "Beta · Rajendra Nagar",
      sentAt: new Date().toISOString(),
    };
    ackId.current = b.id;
    setActive(b);
    playAlarm();
    try {
      window.localStorage.setItem(BROADCAST_KEY, JSON.stringify(b));
    } catch {
      /* ignore */
    }
  }

  function acknowledge() {
    setActive(null);
    chime(); // soft confirmation chime
    try {
      window.localStorage.removeItem(BROADCAST_KEY);
    } catch {
      /* ignore */
    }
    toast.success("Acknowledged — control room notified you are safe.");
  }

  if (!active) {
    // Persistent idle/quiet bar listening for a broadcast.
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-[#1c2740] bg-[#0d1526] p-4">
        <Radio className="h-5 w-5 shrink-0 animate-pulse text-amber-300" />
        <p className="flex-1 text-base text-gray-300">
          <span className="font-bold text-amber-300">Command Link LIVE.</span>{" "}
          Listening for high-priority broadcasts.
        </p>
      </div>
    );
  }

  // Full-screen, non-dismissible-until-ack high-priority alert.
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
      aria-label="Emergency recall order"
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#2a0a0a] p-6 text-center"
    >
      <style>{`
        @keyframes recallFlash {
          0%, 100% { background-color: #7f1d1d; }
          50% { background-color: #b91c1c; }
        }
      `}</style>
      <div
        className="w-full max-w-md rounded-3xl border-4 border-red-500 p-6"
        style={{ animation: "recallFlash 1s step-end infinite" }}
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-white">
          <Megaphone className="h-12 w-12" />
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-wide text-white">
          {active.title}
        </h2>
        <p className="mt-2 text-lg leading-relaxed text-red-100">{active.message}</p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-400/50 bg-red-900/60 px-4 py-1 text-sm font-bold text-red-200">
          <Radio className="h-4 w-4" />
          Sector: {active.sector}
        </div>
        <p className="mt-2 text-xs tabular-nums text-red-200/70">
          {new Date(active.sentAt).toLocaleString()} · Command Room Dispatch
        </p>

        {/* Required acknowledgement */}
        <button
          type="button"
          onClick={acknowledge}
          className="mt-6 flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-emerald-400 bg-emerald-600 text-xl font-black text-white transition active:scale-[0.98]"
        >
          <ShieldCheck className="h-7 w-7" />
          Acknowledge &amp; Confirm Safe
        </button>
        <p className="mt-3 flex items-center justify-center gap-1 text-sm text-red-200/70">
          <X className="h-4 w-4" />
          You cannot dismiss this without acknowledging.
        </p>
      </div>
    </div>
  );
}

function playChime() {
  if (typeof window === "undefined") return;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    /* audio blocked */
  }
}