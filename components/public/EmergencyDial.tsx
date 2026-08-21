// ---------------------------------------------------------------------
// components/public/EmergencyDial.tsx — Phase 2 · Step 8 · Emergency
// Contacts Speed-Dial.
//
// One-tap access to help: a 2×2 grid of large square buttons —
// District Control Room (red), Police (100), Ambulance (108), Fire (101).
// Each is a plain HTML <a href="tel:…"> so taps open the
// phone's native dialer on any device (server-safe — no JS required).
//
// Contrast is deliberately inverted against the dark dl-navy surface:
// white squares with dark text (hard to miss mid-panic), the control
// room square full red as the primary affordance. Replaces the old
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
  },
  {
    label: "Ambulance",
    fullLabel: "Ambulance",
    number: "108",
    href: "tel:108",
    icon: Ambulance,
  },
  { label: "Fire", fullLabel: "Fire", number: "101", href: "tel:101", icon: Flame },
];

export function EmergencyDial() {
  return (
    <section aria-label="Emergency contacts speed dial">
      <p className="eoc-label text-slate-400">EMERGENCY CONTACTS</p>
      <div className="mt-3 flex justify-between gap-3">
        {LINES.map((line) => {
          const Icon = line.icon;
          return (
            <a
              key={line.href}
              href={line.href}
              aria-label={`${line.fullLabel} — ${line.number}`}
              className={`group flex flex-col items-center gap-1.5 transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                line.primary
                  ? "focus-visible:outline-red-400"
                  : "focus-visible:outline-blue-400"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  line.primary
                    ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] group-hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]"
                    : "bg-white/10 text-white border border-white/15 group-hover:bg-white/15 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className="h-5 w-5 transition group-hover:scale-110"
                />
              </span>
              <span className="text-xs font-medium text-slate-400">
                {line.label}
              </span>
              <span className="text-xs font-bold text-white">
                {line.number}
              </span>
            </a>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-500 text-center">
        Taps open your phone&apos;s dialer with the number pre-filled.
      </p>
    </section>
  );
}

export default EmergencyDial;
