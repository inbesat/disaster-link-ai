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
      <button
        type="button"
        onClick={scrollToWeather}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-300"
      >
        <CloudSun aria-hidden="true" className="h-5 w-5" />
        View Weather Forecast
      </button>
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-severity-amber-500 px-5 py-3.5 text-base font-bold text-white transition hover:bg-severity-amber-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-amber-300"
      >
        Check Evacuation Readiness
        <ChevronDown
          aria-hidden="true"
          className={`h-5 w-5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
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
      <Link
        href="/public/map"
        className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[#F97316] px-5 py-3.5 text-base font-bold text-white transition hover:bg-[#EA5B0C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange-light)]"
      >
        <Map aria-hidden="true" className="h-5 w-5" />
        View Evacuation Routes
      </Link>
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
      <Link
        href="/public/shelters"
        className="animate-alert-pulse flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-severity-red-600 px-5 py-5 text-lg font-black uppercase tracking-wide text-white transition hover:bg-severity-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-red-300"
      >
        <Siren aria-hidden="true" className="h-6 w-6" />
        Go to Nearest Shelter
      </Link>
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
      className={`rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 ${
        urgent
          ? "border-red-500/40 bg-red-500/10"
          : "border-white/10 bg-white/5 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg hover:shadow-white/5"
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
