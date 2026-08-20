"use client";

// ---------------------------------------------------------------------
// components/public/BottomNav.tsx — Phase 2 · Step 1 · Citizen app bottom
// navigation.
//
// Sticky 6-item bar pinned to the bottom of the mobile-first citizen app:
// Home (active on the dashboard) · Alerts · Map · Donate · Settings · SOS.
// Centered to the same max-w-md column as the dashboard shell (mx-auto),
// with safe-area padding for notched phones
// (pb-[env(safe-area-inset-bottom)]).
//
// Active state auto-derives from the current route (same isPathActive
// convention as the gov SidebarNavItem), so the Home tab lights up on the
// dashboard and future /public/alerts and /public/map pages highlight
// their own tab with zero prop-threading. The Settings tab links to the
// citizen settings hub (/public/settings) and drops out during Emergency
// Mode like the Alerts tab. The SOS tab is the emergency
// action — Phase 5 · Step 1 — it opens the global SOS modal (see
// components/public/sos) instead of navigating, and gets the citizen
// orange treatment (filled tile + Siren icon) so it reads as the panic
// button, while staying in the same even grid so all five items stay
// evenly spaced.
// ---------------------------------------------------------------------

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellRing,
  HeartHandshake,
  Home,
  Map,
  Settings,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { useSOS } from "@/components/public/sos/SOSContext";
import { useTranslation, type TranslationKey } from "@/lib/i18n/LanguageContext";

type NavItem = {
  /** i18n key for the accessible tab label. */
  label: TranslationKey;
  /** Destination route. */
  href: string;
  /** Lucide icon for the tab. */
  icon: LucideIcon;
  /** SOS tab gets the orange emergency treatment. */
  emergency?: boolean;
  /** Hidden during Emergency Mode (Phase 5 · Step 4 nav lockdown). */
  hideDuringEmergency?: boolean;
};

// The SOS item's href is never navigated to — it only serves as a stable
// React key; the tab opens the global SOS modal instead. This component
// calls useSOS(), so it must only render under app/public/layout's
// SOSProvider (it does — every citizen page lives there). During
// Emergency Mode the non-essential Alerts tab is hidden, locking the
// citizen onto Home / Map / SOS.
const NAV_ITEMS: NavItem[] = [
  { label: "nav_home", href: "/public/dashboard", icon: Home },
  { label: "nav_alerts", href: "/public/alerts", icon: BellRing, hideDuringEmergency: true },
  { label: "nav_map", href: "/public/map", icon: Map },
  {
    label: "nav_donate",
    href: "/public/donations",
    icon: HeartHandshake,
    hideDuringEmergency: true,
  },
  {
    label: "nav_settings",
    href: "/public/settings",
    icon: Settings,
    hideDuringEmergency: true,
  },
  { label: "nav_sos", href: "/public/sos", icon: Siren, emergency: true },
];

/** Route match: exact for "/", segment-aware prefix otherwise. */
function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { isOpen, open, emergency } = useSOS();
  const { t } = useTranslation();

  // Phase 5 · Step 4 lockdown — drop non-essential tabs while an SOS is
  // active so the citizen stays pointed at Home / Map / SOS.
  const items = emergency
    ? NAV_ITEMS.filter((item) => !item.hideDuringEmergency)
    : NAV_ITEMS;

  return (
    <nav
      aria-label="Citizen navigation"
      className={`fixed bottom-0 w-full z-[40] mx-auto max-w-md bg-[rgb(var(--bg-primary-rgb)/80)] pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl border-t border-white/10${
        className ? ` ${className}` : ""
      }`}
    >
      <div
        className="grid h-[72px] items-stretch"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          // SOS is a global modal trigger (Phase 5), not a route.
          if (item.emergency) {
            const active = isOpen;
            return (
              <button
                key={item.href}
                type="button"
                onClick={open}
                aria-expanded={active}
                aria-label="Open emergency SOS menu"
                className="group flex flex-col items-center justify-center gap-1 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dl-orange)]"
              >
                {/* SOS panic button — the ping layer behind the pill creates
                    a heartbeat radar glow so it reads as the panic button. */}
                <span className="relative">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 animate-ping rounded-full bg-red-500/50"
                  />
                  <span
                    aria-hidden="true"
                    className={`relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150 ${
                      active
                        ? "bg-[var(--brand-orange)] text-white shadow-[0_0_16px_rgba(249,115,22,0.45)]"
                        : "bg-[#F97316]/15 text-[var(--dl-orange-light)] group-hover:bg-[#F97316]/25"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                </span>
                <span
                  className={`text-[0.625rem] font-semibold uppercase tracking-wider transition-colors duration-150 ${
                    active ? "text-[var(--dl-orange)]" : "text-[var(--dl-text-muted)]"
                  }`}
                >
                  {t(item.label)}
                </span>
              </button>
            );
          }

          const active = isPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="group flex flex-col items-center justify-center gap-1 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dl-orange)]"
            >
              <span
                aria-hidden="true"
                className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150 ${
                  active
                    ? "bg-[#F97316]/15 text-[var(--dl-orange)]"
                    : "text-[var(--dl-text-muted)] group-hover:text-[var(--dl-text-on-navy)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span
                className={`text-[0.625rem] font-semibold uppercase tracking-wider transition-colors duration-150 ${
                  active ? "text-[var(--dl-orange)]" : "text-[var(--dl-text-muted)]"
                }`}
              >
                {t(item.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
