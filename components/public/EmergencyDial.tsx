// ---------------------------------------------------------------------
// components/public/EmergencyDial.tsx — Phase 2 · Step 8 · Emergency
// Contacts Speed-Dial.
//
// One-tap access to help: a 2×2 grid of large square buttons —
// District Control Room (red), Police (100), Ambulance (108), Fire (101).
// Each is a plain HTML <a href="tel:…"> so taps open the
// phone's native dialer on any device (server-safe — no JS required).
//
// Cards are dark slate tiles with crisp white text and per-service
// accent icons, matching the dark dl-navy surface; the control room
// square stays full rose/red as the primary affordance. Replaces the old
// standalone "Call 1070" strip — the dial IS that CTA now (the control
// room square inherits its job, so the page has one 1070 action, not two).
// ---------------------------------------------------------------------

import {
  Ambulance,
  Building2,
  Flame,
  Shield,
  type LucideIcon,
} from "lucide-react";

type EmergencyLine = {
  label: string;
  fullLabel: string;
  number: string;
  href: string;
  icon: LucideIcon;
  primary?: boolean;
  accentClass?: string;
};

const LINES: EmergencyLine[] = [
  {
    label: "Control",
    fullLabel: "District Control Room",
    number: "1070",
    href: "tel:1070",
    icon: Building2,
    primary: true,
  },
  {
    label: "Police",
    fullLabel: "Police",
    number: "100",
    href: "tel:100",
    icon: Shield,
    accentClass: "text-blue-400",
  },
  {
    label: "Ambulance",
    fullLabel: "Ambulance",
    number: "108",
    href: "tel:108",
    icon: Ambulance,
    accentClass: "text-emerald-400",
  },
  {
    label: "Fire",
    fullLabel: "Fire",
    number: "101",
    href: "tel:101",
    icon: Flame,
    accentClass: "text-amber-400",
  },
];

export function EmergencyDial() {
  return (
    <section aria-label="Emergency contacts speed dial">
      <p className="eoc-label text-[var(--dl-text-muted)]">EMERGENCY DIAL</p>
      <div className="mt-3 grid grid-cols-2 gap-4">
        {LINES.map((line) => {
          const Icon = line.icon;
          return (
            <a
              key={line.href}
              href={line.href}
              aria-label={`${line.fullLabel} — ${line.number}`}
              className={`group flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-xl p-4 transition-all duration-200 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                line.primary
                  ? "bg-rose-600 text-white shadow-[0_0_24px_rgba(244,63,94,0.35)] hover:bg-rose-700 focus-visible:outline-rose-400"
                  : "border border-slate-700/60 bg-slate-800/80 text-white hover:border-slate-600/60 hover:bg-slate-700/80 focus-visible:outline-slate-400"
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`h-5 w-5 transition group-hover:scale-110 ${
                  line.primary ? "text-white" : line.accentClass
                }`}
              />
              <span className="text-[0.625rem] font-bold uppercase leading-none tracking-wide text-white">
                {line.label}
              </span>
              <span className="font-mono text-sm font-bold leading-none text-white">
                {line.number}
              </span>
            </a>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Taps open your phone&apos;s dialer with the number pre-filled.
      </p>
    </section>
  );
}

export default EmergencyDial;
