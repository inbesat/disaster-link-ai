// ---------------------------------------------------------------------
// components/public/EmergencyDial.tsx — Phase 2 · Step 8 · Emergency
// Contacts Speed-Dial.
//
// One-tap access to help: a fixed-height horizontal row of four square
// buttons — District Control Room (red), Police (100), Ambulance (108),
// Fire (101). Each is a plain HTML <a href="tel:…"> so taps open the
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
      <p className="eoc-label text-[var(--dl-text-muted)]">EMERGENCY DIAL</p>
      <div className="mt-3 grid grid-cols-4 gap-2.5">
        {LINES.map((line) => {
          const Icon = line.icon;
          return (
            <a
              key={line.href}
              href={line.href}
              aria-label={`${line.fullLabel} — ${line.number}`}
              className={`group flex aspect-square flex-col items-center justify-center gap-1 rounded-xl transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                line.primary
                  ? "bg-severity-red-600 text-white shadow-[0_0_24px_rgba(239,68,68,0.35)] hover:bg-severity-red-500 focus-visible:outline-severity-red-400"
                  : "bg-white text-[var(--dl-navy)] shadow-[var(--dl-shadow-soft)] hover:bg-gray-100 focus-visible:outline-[var(--dl-orange)]"
              }`}
            >
              <Icon
                aria-hidden="true"
                className={`h-5 w-5 ${
                  line.primary
                    ? "text-white transition group-hover:scale-110"
                    : "text-[var(--dl-blue)] transition group-hover:scale-110"
                }`}
              />
              <span className="text-[0.625rem] font-bold uppercase leading-none tracking-wide">
                {line.label}
              </span>
              <span
                className={`font-mono text-sm font-bold leading-none ${
                  line.primary ? "text-white" : "text-[var(--dl-navy)]"
                }`}
              >
                {line.number}
              </span>
            </a>
          );
        })}
      </div>
      <p className="mt-2 text-[0.6875rem] text-[var(--dl-text-muted)]">
        Taps open your phone&apos;s dialer with the number pre-filled.
      </p>
    </section>
  );
}

export default EmergencyDial;
