"use client";

// ---------------------------------------------------------------------
// app/emergency/offline/page.tsx — Offline-First Architecture · Phase 9
// "First offline experience" static emergency page.
//
// Served when a citizen opens the app with NO cached data yet (no sync has
// ever completed — the worst case for an offline user). Unlike /~offline
// (which shows whatever was cached), this page has nothing to read, so it
// hands over universal emergency steps that require zero connectivity:
// numbered action cards + emergency numbers + a "connect to set up" call
// to action. Pure static content — no network, no IndexedDB, no state.
// ---------------------------------------------------------------------

import {
  Backpack,
  BatteryFull,
  Download,
  Mountain,
  PhoneCall,
  RadioTower,
  ShieldAlert,
  Waves,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

const UNIVERSAL_STEPS = [
  {
    number: "1",
    icon: Mountain,
    title: "Find High Ground",
    description: "Move uphill or to the top floor. Rising water and storm surges climb — never wait.",
  },
  {
    number: "2",
    icon: PhoneCall,
    title: "Call Emergency Services",
    description: "Dial 112 (national) or 108 (ambulance). Calls and SMS work on 2G and no data.",
  },
  {
    number: "3",
    icon: Backpack,
    title: "Emergency Kit Checklist",
    description: "Water, dry food, torch, batteries, power bank, documents, medicines, first aid.",
  },
  {
    number: "4",
    icon: BatteryFull,
    title: "Battery Conservation",
    description: "Low-power mode, dim the screen, switch off Wi-Fi/Bluetooth. Keep calls short.",
  },
  {
    number: "5",
    icon: RadioTower,
    title: "Radio Updates",
    description: "Tune to the local radio for official warnings and shelter announcements.",
  },
];

const EMERGENCY_NUMBERS = [
  { label: "National Emergency", number: "112" },
  { label: "Ambulance", number: "108" },
  { label: "Police", number: "100" },
  { label: "Fire", number: "101" },
  { label: "Disaster Helpline", number: "1070" },
];

export default function EmergencyOfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-[var(--dl-navy)] text-[var(--dl-text-on-navy)]">
      {/* Alert banner */}
      <div
        role="alert"
        className="flex items-center justify-center gap-2.5 bg-severity-amber-500 px-4 py-3 text-center"
      >
        <WifiOff aria-hidden="true" className="h-5 w-5 shrink-0 text-black" />
        <p className="text-sm font-black uppercase tracking-widest text-black">
          No data cached on this device
        </p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] pt-8">
        {/* Centered warning */}
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-severity-amber-500/15 ring-1 ring-severity-amber-500/40">
            <ShieldAlert aria-hidden="true" className="h-8 w-8 text-severity-amber-400" />
          </span>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-white">
            Limited Functionality — No Data Cached
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--dl-text-muted)]">
            You are offline and haven&apos;t synced data yet. Until you connect,
            here are universal emergency steps that work without any downloaded
            information.
          </p>
        </div>

        {/* Numbered action cards */}
        <ol className="mt-8 space-y-3">
          {UNIVERSAL_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li
                key={step.number}
                className="flex items-start gap-3.5 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F97316]/20 text-sm font-black text-[var(--brand-orangeLight)] ring-1 ring-[#F97316]/40">
                  {step.number}
                </span>
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    <Icon aria-hidden="true" className="h-4 w-4 text-[var(--dl-orange-light)]" />
                    {step.title}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--dl-text-muted)]">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Emergency numbers (tel: links work with no data) */}
        <section className="mt-8">
          <p className="eoc-label text-[var(--dl-text-muted)]">
            EMERGENCY NUMBERS — TAP TO CALL
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {EMERGENCY_NUMBERS.map((line) => (
              <a
                key={line.number}
                href={`tel:${line.number}`}
                className="flex items-center justify-between gap-2 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 px-3.5 py-3 transition hover:border-[var(--dl-orange)]/50 active:scale-[0.99]"
              >
                <span className="text-xs font-semibold text-white">{line.label}</span>
                <span className="font-mono text-sm font-bold text-[var(--dl-orange-light)]">
                  {line.number}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Connect-to-setup call to action */}
        <Link
          href="/public/setup/location"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[var(--brand-orange)] px-5 py-4 text-sm font-black text-black transition hover:bg-[#FB923C] active:scale-[0.99]"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Connect to Internet to Download Local AI
        </Link>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-[var(--dl-text-muted)]">
          <Waves aria-hidden="true" className="h-3.5 w-3.5" />
          Reconnect to download shelters, maps and the offline AI assistant.
        </p>
      </div>
    </main>
  );
}
