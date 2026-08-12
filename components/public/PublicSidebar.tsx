"use client";

// ---------------------------------------------------------------------
// components/public/PublicSidebar.tsx — Desktop-only navigation for the
// citizen portal.
//
// Mirrors the mobile BottomNav (components/public/BottomNav) exactly:
// the same five items — Home · Alerts · Map · Settings · SOS — with the
// same lucide icons, the same isPathActive route convention, the same
// Emergency Mode lockdown (Alerts/Settings drop out while an SOS is
// active), and the SOS item as a global modal trigger (useSOS().open())
// instead of a route.
//
// Visibility: hidden on <md screens (where the sticky BottomNav takes
// over); sticky left sidebar on md+ via the parent layout's
// `flex-col md:flex-row` shell.
// ---------------------------------------------------------------------

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, Home, Map, Settings, ShieldCheck, Siren, type LucideIcon } from "lucide-react";
import { useSOS } from "@/components/public/sos/SOSContext";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  emergency?: boolean;
  hideDuringEmergency?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/public/dashboard", icon: Home },
  { label: "Alerts", href: "/public/alerts", icon: BellRing, hideDuringEmergency: true },
  { label: "Map", href: "/public/map", icon: Map },
  {
    label: "Settings",
    href: "/public/settings",
    icon: Settings,
    hideDuringEmergency: true,
  },
  { label: "SOS", href: "/public/sos", icon: Siren, emergency: true },
];

/** Route match: exact for "/", segment-aware prefix otherwise. */
function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PublicSidebar() {
  const pathname = usePathname();
  const { isOpen, open, emergency } = useSOS();

  const items = emergency
    ? NAV_ITEMS.filter((item) => !item.hideDuringEmergency)
    : NAV_ITEMS;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a0f1a] p-4 md:flex">
      {/* App title / logo — desktop layout polish. */}
      <Link
        href="/public/dashboard"
        className="mb-8 flex items-center gap-3 px-2"
        aria-label="Bharat Shakti home"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316]/15 text-[var(--dl-orange)]">
          <ShieldCheck className="h-6 w-6" strokeWidth={2} />
        </span>
        <span className="flex flex-col">
          <span className="text-base font-bold leading-tight text-white">
            Bharat Shakti
          </span>
          <span className="text-xs text-[var(--dl-text-muted)]">
            Citizen Safety Portal
          </span>
        </span>
      </Link>

      <nav aria-label="Citizen navigation" className="flex flex-1 flex-col gap-1">
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dl-orange)] ${
                  active
                    ? "bg-[#F97316]/15 font-medium text-[var(--dl-orange)]"
                    : "text-[var(--dl-text-muted)] hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
                {item.label}
              </button>
            );
          }

          const active = isPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dl-orange)] ${
                active
                  ? "bg-white/10 font-medium text-white"
                  : "text-[var(--dl-text-muted)] hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Emergency number footer for desktop polish. */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-[var(--dl-text-muted)]">
          Emergency
        </p>
        <p className="mt-1 text-lg font-bold text-[var(--dl-orange)]">112</p>
      </div>
    </aside>
  );
}
