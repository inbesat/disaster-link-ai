// ---------------------------------------------------------------------
// components/navigation/DashboardSidebar.tsx
// UI/UX Phase 2 · Step 3 — the full composed sidebar nav.
//
// Config-driven: maps over lib/config/navigation.ts (NAVIGATION_ROUTES),
// filters it by the active user's role (defaults to a mock 'district_admin'
// per the spec — the server layout can pass the real role later via the
// `userRole` prop with zero component changes), groups the survivors by
// section, and renders SidebarSection + SidebarNavItem for each.
//
// Only the routes the role may see render — e.g. a field responder never
// sees Shelters/Resources/Satellite, and Settings is super_admin-only.
//
// Like <Sidebar>, this is both controlled (`collapsed` + `onToggle`, used
// by the dashboard shell so the content margin animates with it) and
// uncontrolled (omit both — used by the styleguide demo). `variant` lets
// the styleguide preview it in-flow as `inline`.
//
// The Active Alerts pill receives the unacknowledged AlertLog count from
// the server layout (computed once per request, with a mock fallback when
// the DB isn't reachable).
// ---------------------------------------------------------------------

"use client";

import type { Role } from "@/lib/validations/user";
import {
  NAV_SECTION_LABELS,
  NAV_SECTIONS,
  NAVIGATION_ROUTES,
  filterRoutesByRole,
} from "@/lib/config/navigation";
import { LogOut } from "lucide-react";
import { clearGuestMode, signOutAction } from "@/app/actions/auth";
import useHotkeys from "@/hooks/useHotkeys";
import Sidebar, { type SidebarVariant } from "./Sidebar";
import SidebarSection from "./SidebarSection";
import SidebarNavItem from "./SidebarNavItem";
import { useSidebar } from "./sidebar-context";

// Top-level navigation hotkeys (Phase 2 · Step 9) — `mod` = Cmd on macOS,
// Ctrl on Windows/Linux. Display strings use the ⌘ glyph for brevity.
const NAV_SHORTCUTS: Record<string, string> = {
  "mod+1": "/command-center",
  "mod+2": "/alerts",
  "mod+3": "/evacuations",
  "mod+4": "/inventory",
  "mod+5": "/ai-planner",
  "mod+6": "/directory",
};

const NAV_SHORTCUT_LABELS: Record<string, string> = {
  "/command-center": "⌘1",
  "/alerts": "⌘2",
  "/evacuations": "⌘3",
  "/inventory": "⌘4",
  "/ai-planner": "⌘5",
  "/directory": "⌘6",
};

type DashboardSidebarProps = {
  /** Unacknowledged AlertLog count — renders the Active Alerts pill. */
  alertsBadgeCount?: number;
  /** Active user role — filters which nav routes render (mock default). */
  userRole?: Role;
  /** Guest (demo) mode — sign-out becomes "Exit Demo" (clearGuestMode). */
  guest?: boolean;
  /** Controlled collapsed state — omit for internal state. */
  collapsed?: boolean;
  /** Callback when the toggle is pressed (controlled mode). */
  onToggle?: () => void;
  /** Mobile drawer open state — slides the fixed sidebar in over content. */
  isOpenMobile?: boolean;
  /** Close the mobile drawer (backdrop click / Escape). */
  onCloseMobile?: () => void;
  /** fixed: pins to the viewport (dashboard) · inline: in-flow (styleguide). */
  variant?: SidebarVariant;
  className?: string;
};

// Spec mock — the server layout overrides this with the real role later.
const MOCK_ROLE: Role = "district_admin";

export function DashboardSidebar({
  alertsBadgeCount,
  userRole = MOCK_ROLE,
  guest = false,
  collapsed,
  onToggle,
  isOpenMobile,
  onCloseMobile,
  variant = "fixed",
  className = "",
}: DashboardSidebarProps) {
  const visibleRoutes = filterRoutesByRole(NAVIGATION_ROUTES, userRole);

  // Global keyboard shortcuts — navigate regardless of collapse state.
  useHotkeys(NAV_SHORTCUTS);

  // Dedupe shortcut hints — two routes point at /command-center, so only
  // the first item per href gets the ⌘ badge.
  const shortcutAssigned = new Set<string>();

  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      isOpenMobile={isOpenMobile}
      onCloseMobile={onCloseMobile}
      variant={variant}
      className={className}
      footer={<SignOutButton guest={guest} />}
    >
      {NAV_SECTIONS.map((section) => {
        const sectionRoutes = visibleRoutes.filter((route) => route.section === section);
        // Skip empty sections so a filtered-out group leaves no stray divider.
        if (sectionRoutes.length === 0) return null;

        return (
          <SidebarSection key={section} label={NAV_SECTION_LABELS[section]}>
            {sectionRoutes.map((route) => {
              const shortcut = shortcutAssigned.has(route.href)
                ? undefined
                : NAV_SHORTCUT_LABELS[route.href];
              if (shortcut) shortcutAssigned.add(route.href);
              return (
                <SidebarNavItem
                  key={route.label}
                  icon={route.icon}
                  label={route.label}
                  href={route.href}
                  badgeCount={route.href === "/alerts" ? alertsBadgeCount : undefined}
                  shortcut={shortcut}
                  subRoutes={route.subRoutes}
                />
              );
            })}
          </SidebarSection>
        );
      })}
    </Sidebar>
  );
}

export default DashboardSidebar;

// ---------------------------------------------------------------------
// Sign Out — pinned at the absolute bottom of the sidebar (via Sidebar's
// `footer` slot). Officials log out through the server action, which ends
// the Supabase session AND clears the demo role/guest cookies before
// redirecting to /login. Guests get "Exit Demo" (clearGuestMode) so the
// read-only demo ride can't leave a stale session behind.
//
// Mirrors SidebarNavItem's row styling: collapses to an icon-only button on
// the 64px rail (native `title` tooltip doubles for the label there).
// ---------------------------------------------------------------------
function SignOutButton({ guest }: { guest: boolean }) {
  const { collapsed } = useSidebar();
  const label = guest ? "Exit Demo" : "Sign Out";

  return (
    <div className="border-t border-subtle p-2">
      <form action={guest ? clearGuestMode : signOutAction}>
        <button
          type="submit"
          aria-label={collapsed ? label : undefined}
          title={collapsed ? label : undefined}
          className={`flex h-10 w-full items-center gap-3 rounded-md border-l-2 border-transparent px-3 text-sm text-muted transition-colors duration-150 motion-reduce:transition-none hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
        </button>
      </form>
    </div>
  );
}
