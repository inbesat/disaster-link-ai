"use client";

// ---------------------------------------------------------------------
// components/public/BottomNav.tsx — Phase 2 · Step 1 · Citizen app bottom
// navigation.
//
// Sticky 4-item bar pinned to the bottom of the mobile-first citizen app:
// Home (active on the dashboard) · Alerts · Map · SOS. Centered to the
// same max-w-md column as the dashboard shell (mx-auto), with safe-area
// padding for notched phones (pb-[env(safe-area-inset-bottom)]).
//
// Active state auto-derives from the current route (same isPathActive
// convention as the gov SidebarNavItem), so the Home tab lights up on the
// dashboard and future /public/alerts, /public/map and /public/report
// pages highlight their own tab with zero prop-threading. The SOS tab is
// the emergency action — it gets the citizen orange treatment (filled
// tile + Siren icon) so it reads as the panic button, while staying in
// the same even grid so all four items stay evenly spaced.
// ---------------------------------------------------------------------

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellRing, Home, Map, Siren, type LucideIcon } from "lucide-react";

type NavItem = {
  /** Accessible label for the tab. */
  label: string;
  /** Destination route. */
  href: string;
  /** Lucide icon for the tab. */
  icon: LucideIcon;
  /** SOS tab gets the orange emergency treatment. */
  emergency?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/public/dashboard", icon: Home },
  { label: "Alerts", href: "/public/alerts", icon: BellRing },
  { label: "Map", href: "/public/map", icon: Map },
  { label: "SOS", href: "/public/report", icon: Siren, emergency: true },
];

/** Route match: exact for "/", segment-aware prefix otherwise. */
function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Citizen navigation"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-white/10 bg-[#0F2A4F]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg"
    >
      <div className="grid h-[72px] grid-cols-4 items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isPathActive(pathname, item.href);
          const Icon = item.icon;
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
                  item.emergency
                    ? active
                      ? "bg-[#F97316] text-white shadow-[0_0_16px_rgba(249,115,22,0.45)]"
                      : "bg-[#F97316]/15 text-[var(--dl-orange-light)] group-hover:bg-[#F97316]/25"
                    : active
                      ? "bg-[#F97316]/15 text-[var(--dl-orange)]"
                      : "text-[var(--dl-text-muted)] group-hover:text-[var(--dl-text-on-navy)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2} />
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150 ${
                  active ? "text-[var(--dl-orange)]" : "text-[var(--dl-text-muted)]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
