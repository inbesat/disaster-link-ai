"use client";

// ---------------------------------------------------------------------
// app/~offline/page.tsx — Phase 13 · Step 1 · Offline fallback shell.
//
// next-pwa serves this page whenever a navigation fails while the device
// is offline (navigateFallback → /~offline). It is a fully cached,
// zero-network page: the "YOU ARE OFFLINE" banner, the emergency numbers
// (tel: links still work without data) and the user's last known safety
// status read straight from localStorage. Matches the citizen app's dark
// navy visual language so the transition feels intentional.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Ambulance,
  Building2,
  Flame,
  Shield,
  ShieldCheck,
  Signal,
  WifiOff,
} from "lucide-react";

const EMERGENCY_LINES = [
  { label: "National Emergency", number: "112", href: "tel:112", icon: Shield },
  { label: "Ambulance", number: "108", href: "tel:108", icon: Ambulance },
  { label: "Police", number: "100", href: "tel:100", icon: Shield },
  { label: "Fire", number: "101", href: "tel:101", icon: Flame },
  { label: "Disaster Helpline", number: "1070", href: "tel:1070", icon: Building2 },
];

type SafetyStatus = "safe" | "unsafe" | "unknown";

export default function OfflinePage() {
  // Hydration-safe read of the last status shared by the citizen
  // (written by SafeStatusToggle to drip:i-am-safe).
  const [status, setStatus] = useState<SafetyStatus>("unknown");

  useEffect(() => {
    // SafeStatusToggle persists to drip:i-am-safe as the literal string
    // "1" when the citizen marks themselves safe (lib/mock-data/
    // public-alerts.ts #SAFE_STATUS_KEY) — parse defensively.
    try {
      const raw = window.localStorage.getItem("drip:i-am-safe");
      setStatus(raw === "1" ? "safe" : raw === "0" ? "unsafe" : "unknown");
    } catch {
      setStatus("unknown");
    }
  }, []);

  return (
    <main className="flex min-h-[100dvh] flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Highly visible offline banner */}
      <div
        role="alert"
        className="flex items-center justify-center gap-2.5 bg-severity-amber-500 px-4 py-3 text-center"
      >
        <WifiOff aria-hidden="true" className="h-5 w-5 shrink-0 text-black" />
        <p className="text-sm font-black uppercase tracking-widest text-black">
          📶 You are offline
        </p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-6">
        <p className="eoc-label text-[var(--dl-text-muted)]">CONNECTION LOST</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-white">
          No internet — here&apos;s what you still have
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--dl-text-muted)]">
          Cached emergency information works without data. Taps on the numbers below open
          your dialer — calls and SMS still work on 2G or no data.
        </p>

        {/* Last known safety status */}
        <section className="mt-6 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4">
          <p className="eoc-label text-[var(--dl-text-muted)]">
            LAST SHARED SAFETY STATUS
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                status === "safe"
                  ? "bg-severity-green-500/20 text-severity-green-400"
                  : "bg-white/10 text-[var(--dl-text-muted)]"
              }`}
            >
              {status === "safe" ? (
                <ShieldCheck aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Signal aria-hidden="true" className="h-5 w-5" />
              )}
            </span>
            <p className="text-sm font-bold text-white">
              {status === "safe" && "You are marked SAFE"}
              {status === "unsafe" && "You were marked IN DANGER"}
              {status === "unknown" && "No safety status shared yet"}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-[var(--dl-text-muted)]">
            Shared statuses are synced automatically once you&apos;re back online.
          </p>
        </section>

        {/* Cached emergency numbers */}
        <section className="mt-6">
          <p className="eoc-label text-[var(--dl-text-muted)]">
            CACHED EMERGENCY NUMBERS
          </p>
          <ul className="mt-3 space-y-2.5">
            {EMERGENCY_LINES.map((line) => {
              const Icon = line.icon;
              return (
                <li key={line.href}>
                  <a
                    href={line.href}
                    className="flex items-center gap-3 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-3.5 transition hover:border-[var(--dl-orange)]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] active:scale-[0.99]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
                      <Icon aria-hidden="true" className="h-4 w-4 text-[#FDBA74]" />
                    </span>
                    <span className="flex-1 text-sm font-semibold text-white">
                      {line.label}
                    </span>
                    <span className="font-mono text-base font-bold text-[var(--dl-orange-light)]">
                      {line.number}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <p className="mt-6 text-center text-[11px] text-[var(--dl-text-muted)]">
          Reconnect to see live alerts, maps and shelter updates.
        </p>
      </div>
    </main>
  );
}
