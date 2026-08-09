"use client";

// ---------------------------------------------------------------------
// components/navigation/BottomNav.tsx
// UI/UX Phase 3 · Steps 1–6 — mobile-first bottom navigation shell.
//
// Two contextual modes, both sharing the fixed 72px bar shell
// (bg-[#0f172a]/95, blur, top border, safe-area padding, lg:hidden):
//
//   NAV MODE (default) — seven items: Dashboard, Predictions, Map, AI
//   Planner, Alerts, Team, More. Active tab fills the icon with
//   --accent-primary and pins a 2px accent line (BottomNavItem). Alerts
//   carries a red count pill (live unacknowledged count, mock "3"
//   fallback), Predictions an amber dot and AI Planner a purple dot.
//   The Emergency SOS FAB floats centered above the bar, and "More" opens
//   the spillover sheet (Step 5).
//
//   MAP MODE (Step 6) — when the pathname matches a Live Map route
//   (/command-center or /field/map) the 7 tabs disappear and are replaced
//   by context-aware map tools: Layers, Locate Me, Measure, Fullscreen,
//   plus a "Back" chevron on the far left to exit map mode. A route change
//   re-arms map mode on the next visit (tap Back → nav toggles classic
//   until you navigate away and back).
//
//   SWIPES (Step 7) — react-swipeable on the bar: swipe left cycles the
//   active tab to the next item, swipe right to the previous (wraps at the
//   edges). Map-mode swipes are ignored.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import toast from "react-hot-toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import {
  Bot,
  ChevronLeft,
  Layers,
  LayoutDashboard,
  LocateFixed,
  Map as MapIcon,
  Maximize,
  MoreHorizontal,
  Ruler,
  TriangleAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BottomNavItem from "./BottomNavItem";
import EmergencyFAB from "./EmergencyFAB";
import MoreBottomSheet from "./MoreBottomSheet";

/** Routes that render the map-tools mode instead of global navigation. */
const MAP_ROUTES = ["/command-center", "/field/map"];

type BottomNavEntry = {
  /** Stable React key (unique per item — hrefs can repeat). */
  key: string;
  /** Label under the icon. */
  label: string;
  /** Destination route — the router is active when the pathname matches. */
  href: string;
  /** Lucide icon glyph. */
  icon: LucideIcon;
  /** Notification badge count (Step 3 → Present → colored dot; > 0 → number pill). */
  badgeCount?: number;
  /** Tailwind bg class for the badge dot/pill. */
  badgeColor?: string;
  /** Use the shell's unacknowledged-alerts count for this tab. */
  liveBadge?: boolean;
  /** Opens the More spillover sheet instead of navigating (Step 5). */
  opensSheet?: boolean;
};

const ITEMS: BottomNavEntry[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/command-center",
    icon: LayoutDashboard,
  },
  {
    key: "predictions",
    label: "Predictions",
    href: "/compare",
    icon: TrendingUp,
    badgeCount: 0,
    badgeColor: "bg-amber-500",
  },
  { key: "map", label: "Map", href: "/field/map", icon: MapIcon },
  {
    key: "ai-planner",
    label: "AI Planner",
    href: "/ai-planner",
    icon: Bot,
    badgeCount: 0,
    badgeColor: "bg-purple-500",
  },
  {
    key: "alerts",
    label: "Alerts",
    href: "/alerts",
    icon: TriangleAlert,
    liveBadge: true,
    badgeColor: "bg-red-500",
  },
  { key: "team", label: "Team", href: "/directory", icon: Users },
  {
    key: "more",
    label: "More",
    href: "/settings/profile",
    icon: MoreHorizontal,
    opensSheet: true,
  },
];

type MapTool = {
  label: string;
  icon: LucideIcon;
  /** Feedback placeholder — the real handlers land in a later map step. */
  action: () => void;
};

const MAP_TOOLS: MapTool[] = [
  {
    label: "Layers",
    icon: Layers,
    action: () => toast("Layers — pick which map overlays to show."),
  },
  {
    label: "Locate Me",
    icon: LocateFixed,
    action: () => toast("Locate me — centering on your GPS position…"),
  },
  {
    label: "Measure",
    icon: Ruler,
    action: () => toast("Measure — tap the map to start measuring."),
  },
  {
    label: "Fullscreen",
    icon: Maximize,
    action: () => toast("Fullscreen toggled."),
  },
];

/** Route match: exact for "/", prefix match (segment-aware) otherwise. */
function isPathActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type BottomNavProps = {
  /** Unacknowledged AlertLog count — rendered on the Alerts tab. */
  alertsBadgeCount?: number;
};

export function BottomNav({ alertsBadgeCount }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mapModeOff, setMapModeOff] = useState(false);

  // Re-arm map mode once the user navigates (back → on → back…).
  useEffect(() => {
    setMapModeOff(false);
  }, [pathname]);

  const onMapRoute = MAP_ROUTES.some((route) => isPathActive(pathname, route));
  const mapMode = onMapRoute && !mapModeOff;

  // Tab cycling (Step 7): a swipe on the bar moves the active tab through
  // the ITEMS list — left = next (Dashboard → Predictions), right = back.
  // Indexes wrap mod n, so it loops seamlessly at both edges. Only active
  // in NAV mode; the map toolbar ignores swipes.
  const cycleTab = (direction: 1 | -1) => {
    if (mapMode) return;
    const count = ITEMS.length;
    const current = ITEMS.findIndex((item) => isPathActive(pathname, item.href));
    const base = current === -1 ? 0 : current;
    const next = (base + direction + count) % count;
    router.push(ITEMS[next].href);
    // Physical confirmation (Step 8) — the flick buzzes on supported phones.
    triggerLightHaptic();
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => cycleTab(1),
    onSwipedRight: () => cycleTab(-1),
    delta: 24,
    swipeDuration: 400,
    trackMouse: false,
  });

  return (
    <>
      <nav
        {...swipeHandlers}
        aria-label={mapMode ? "Map tools" : "Main navigation"}
        className="fixed inset-x-0 bottom-0 z-30 h-[72px] w-full border-t border-white/10 bg-[#0f172a]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        {/* Map tools mode — replaces global navigation on the Live Map. */}
        {mapMode ? (
          <div className="mx-auto flex h-full max-w-md items-stretch px-1.5">
            {/* Exit the map tools back to global navigation. */}
            <button
              type="button"
              onClick={() => {
                triggerLightHaptic();
                setMapModeOff(true);
              }}
              aria-label="Back to navigation"
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-md text-slate-400 transition-colors duration-150 motion-reduce:transition-none outline-none hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={1.5} aria-hidden />
              <span className="truncate text-[10px] font-semibold">Back</span>
            </button>
            {MAP_TOOLS.map((tool) => (
              <BottomNavItem
                key={tool.label}
                icon={tool.icon}
                label={tool.label}
                isActive={false}
                onClick={tool.action}
              />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex h-full max-w-md items-stretch px-1.5">
            {ITEMS.map((item) => (
              <BottomNavItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                isActive={item.opensSheet ? moreOpen : isPathActive(pathname, item.href)}
                onClick={
                  item.opensSheet ? () => setMoreOpen(true) : () => router.push(item.href)
                }
                badgeCount={item.liveBadge ? (alertsBadgeCount ?? 3) : item.badgeCount}
                badgeColor={item.badgeColor}
              />
            ))}
          </div>
        )}

        {/* Emergency SOS FAB — stays reachable in both modes. */}
        <EmergencyFAB />
      </nav>

      {/* More spillover menu (Step 5) — map mode has no More tab, so this
          only mounts when opened from NAV mode. */}
      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

export default BottomNav;
