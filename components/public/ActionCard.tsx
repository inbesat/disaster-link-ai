"use client";

// ---------------------------------------------------------------------
// components/public/ActionCard.tsx — Phase 2 · Step 4 · Contextual Action
// Card.
//
// Tells the citizen exactly what to do next, one card below the Safety
// Hero, keyed off the same SafetyStatus. A switch/case renders the right
// guidance + primary action per status:
//
//   SAFE     → "View Weather Forecast"   (scrolls to the carousel below)
//   WATCH    → "Check Evacuation Readiness" + collapsible checklist
//   PREPARE  → "View Evacuation Routes"  (citizen map)
//   EVACUATE → massive pulsing red "GO TO NEAREST SHELTER"
//
// Actions that already have a real home on the page use live behaviour
// (scrollIntoView, inline toggle); future citizen modules are linked to
// their planned routes (the same convention as the dashboard module grid).
// ---------------------------------------------------------------------

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDown,
  CloudSun,
  Map,
  Route,
  ShieldCheck,
  Siren,
  type LucideIcon,
} from "lucide-react";
import type { SafetyStatus } from "@/lib/mock-data/hazard-zones";

const WEATHER_CAROUSEL_ID = "citizen-weather-carousel";

type ActionCardProps = {
  /** Current safety status — drives the switch/case. */
  status: SafetyStatus;
};

const CHECKLIST = [
  "Pack a go-bag — documents, medicines, torch, power bank",
  "Note your nearest shelter & the route to reach it",
  "Charge your phone and keep your family circle updated",
  "Know where to turn off gas & electricity at home",
];

function scrollToWeather() {
  document.getElementById(WEATHER_CAROUSEL_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

/** SAFE — no action needed, peek at the forecast. */
function SafeAction() {
  return (
    <ActionBody
      icon={CloudSun}
      iconClass="bg-severity-green-500/15 text-severity-green-300"
      title="You're all clear"
      copy="No active threat in your area right now. Check the forecast to stay ahead of any change."
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/30 transition-all duration-500" />
        <button
          type="button"
          onClick={scrollToWeather}
          className="relative flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3.5 text-base font-bold text-slate-900 shadow-lg shadow-emerald-500/25 transition-transform duration-200 hover:bg-emerald-400 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          <CloudSun aria-hidden="true" className="h-5 w-5" />
          View Weather Forecast
        </button>
      </div>
    </ActionBody>
  );
}

/** WATCH — monitored; get readiness sorted. */
function WatchAction() {
  const [open, setOpen] = useState(false);
  return (
    <ActionBody
      icon={ShieldCheck}
      iconClass="bg-severity-amber-500/15 text-severity-amber-300"
      title="Conditions are being monitored"
      copy="Nothing to act on yet — but get ready so you're never caught off guard."
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl group-hover:bg-amber-500/30 transition-all duration-500" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="relative flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-3.5 text-base font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition-transform duration-200 hover:bg-amber-400 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          Check Evacuation Readiness
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <ul className="mt-3 space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--dl-text-on-navy)]">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-severity-amber-400" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </ActionBody>
  );
}

/** PREPARE — flooding likely; know your way out. */
function PrepareAction() {
  return (
    <ActionBody
      icon={Route}
      iconClass="bg-[#F97316]/15 text-[#FDBA74]"
      title="Prepare to evacuate"
      copy="Flooding is likely in the coming hours. Know the evacuation routes before you need them."
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl group-hover:bg-orange-500/30 transition-all duration-500" />
        <Link
          href="/public/map"
          className="relative flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3.5 text-base font-bold text-slate-900 shadow-lg shadow-orange-500/25 transition-transform duration-200 hover:bg-orange-400 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
        >
          <Map aria-hidden="true" className="h-5 w-5" />
          View Evacuation Routes
        </Link>
      </div>
    </ActionBody>
  );
}

/** EVACUATE — massive pulsing red call to action. */
function EvacuateAction() {
  return (
    <ActionBody
      icon={Siren}
      iconClass="bg-severity-red-500/20 text-severity-red-300"
      title="Evacuate now"
      copy="Move to higher ground immediately. Do not wait — your safety comes first."
      urgent
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-red-500/25 rounded-full blur-xl group-hover:bg-red-500/40 transition-all duration-500 animate-pulse" />
        <Link
          href="/public/shelters"
          className="relative flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-5 text-lg font-black uppercase tracking-wide text-white shadow-lg shadow-red-500/30 transition-transform duration-200 hover:bg-red-500 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
        >
          <Siren aria-hidden="true" className="h-6 w-6" />
          Go to Nearest Shelter
        </Link>
      </div>
    </ActionBody>
  );
}

/** Shared card shell + heading row. */
function ActionBody({
  icon: Icon,
  iconClass,
  title,
  copy,
  urgent = false,
  children,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  copy: string;
  urgent?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={`What to do next — ${title}`}
      className={`rounded-3xl border p-5 backdrop-blur-xl transition-all duration-300 ${
        urgent
          ? "border-red-500/40 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
          : "border-white/10 bg-white/5 hover:-translate-y-1 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold text-white">{title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--dl-text-muted)]">{copy}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ActionCard({ status }: ActionCardProps) {
  switch (status) {
    case "WATCH":
      return <WatchAction />;
    case "PREPARE":
      return <PrepareAction />;
    case "EVACUATE":
      return <EvacuateAction />;
    case "SAFE":
    default:
      return <SafeAction />;
  }
}

export default ActionCard;
