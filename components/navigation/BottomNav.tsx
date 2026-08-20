"use client";

// ---------------------------------------------------------------------
// components/navigation/BottomNav.tsx
// UI/UX Phase 3 · Steps 1–6 — mobile-first bottom navigation shell.
//
// Two contextual modes, both sharing the fixed 72px bar shell
// (bg-[rgb(var(--bg-secondary-rgb)/95)], blur, top border, safe-area padding, md:hidden —
// phones only; tablet+ uses the pinned sidebar, see audit pass Aug 9):
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
//
//   ONE-HANDED MODE (Step 10) — a rapid double-tap on the bar's background
//   (gutter area, not the tabs) toggles iOS-style Reachability: the shell
//   slides the whole content column down 25vh so top-of-page controls land
//   in thumb range. The bar itself stays put — its top edge tints accent
//   while the mode is on, enabling fires a hint toast, and a "Restore"
//   chip appears above the bar for keyboard/AT users (the mode is not
//   gesture-only). Completed swipes cancel the pending tap (a swipe is
//   not a double-tap); plain taps never do.
// ---------------------------------------------------------------------

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSwipeable } from "react-swipeable";
import toast from "react-hot-toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import useToast from "@/hooks/useToast";
import {
  Bot,
  ChevronDown,
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

/** Two taps closer than this (ms) count as a double-tap. */
const DOUBLE_TAP_MS = 300;

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
  /** One-handed (Reachability) mode active — tints the bar's top edge. */
  oneHanded?: boolean;
  /** Rapid double-tap on the bar's background toggles this (Step 10). */
  onToggleOneHanded?: () => void;
};

export function BottomNav({
  alertsBadgeCount,
  oneHanded = false,
  onToggleOneHanded,
}: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mapModeOff, setMapModeOff] = useState(false);
  const toast = useToast();

  // Step 10 — one-handed mode. Two rapid taps on the bar's background (the
  // gutter — never the tabs or the SOS FAB) toggle Reachability. The shell
  // owns the state and translates the content column; we just detect the
  // gesture here and ask it to flip.
  const lastTapRef = useRef(0);
  const handleBarPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [role='button']")) return;
    const now = Date.now();
    if (now - lastTapRef.current <= DOUBLE_TAP_MS) {
      lastTapRef.current = 0; // consume the pair
      triggerLightHaptic();
      const turningOn = !oneHanded;
      onToggleOneHanded?.();
      if (turningOn) {
        toast.info({
          title: "One-handed mode on",
          description:
            "Screen slid down for thumb reach — double-tap the nav bar to restore.",
          duration: 2600,
        });
      }
    } else {
      lastTapRef.current = now;
    }
  };

  // Visible escape hatch for the mode (Step 10) — keyboard/SR users can't
  // double-tap, so while the mode is on a small Restore chip sits above the
  // bar; tapping it (or double-tapping the gutter) turns it back off.
  const restoreOneHanded = () => {
    triggerLightHaptic();
    onToggleOneHanded?.();
  };

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
    // A completed swipe is not a double-tap — cancel any pending tap so two
    // quick swipes can't accidentally toggle one-handed mode. NOTE: this
    // must NOT live in onTouchStartOrOnMouseDown — react-swipeable fires
    // that on every touchstart, which would wipe the pending tap before the
    // second tap of a double-tap ever arrives.
    onSwipedLeft: () => {
      lastTapRef.current = 0;
      cycleTab(1);
    },
    onSwipedRight: () => {
      lastTapRef.current = 0;
      cycleTab(-1);
    },
    delta: 24,
    swipeDuration: 400,
    trackMouse: false,
  });

  return (
    <>
      <nav
        {...swipeHandlers}
        onPointerDown={handleBarPointerDown}
        aria-label={mapMode ? "Map tools" : "Main navigation"}
        data-one-handed={oneHanded || undefined}
        className={`fixed inset-x-0 bottom-0 z-30 h-[72px] w-full border-t bg-[rgb(var(--bg-secondary-rgb)/95)] pb-[env(safe-area-inset-bottom)] backdrop-blur-lg transition-colors duration-150 motion-reduce:transition-none md:hidden ${
          oneHanded ? "border-t-accent-primary" : "border-t-white/10"
        }`}
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
              <span className="truncate text-[0.625rem] font-semibold">Back</span>
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

      {/* One-handed Restore chip (Step 10) — visible while the mode is on so
          it can be turned off without the gesture (keyboard / screen-reader
          users can focus it). Uses bg-tertiary/var() per gotcha #2 — the
          hand-written class can't take a hover: variant. */}
      {oneHanded && (
        <button
          type="button"
          onClick={restoreOneHanded}
          aria-pressed="true"
          className="fixed bottom-[84px] right-3 z-30 flex items-center gap-1.5 rounded-full border border-accent-primary/40 bg-secondary px-3 py-1.5 text-xs font-semibold text-primary shadow-card transition hover:bg-[var(--bg-tertiary)] motion-reduce:transition-none"
        >
          <ChevronDown
            className="h-3.5 w-3.5 rotate-180 text-accent-primary"
            aria-hidden
          />
          Restore
        </button>
      )}

      {/* More spillover menu (Step 5) — map mode has no More tab, so this
          only mounts when opened from NAV mode. */}
      <MoreBottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}

export default BottomNav;
