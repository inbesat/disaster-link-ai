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
import useHotkeys from "@/hooks/useHotkeys";
import Sidebar, { type SidebarVariant } from "./Sidebar";
import SidebarSection from "./SidebarSection";
import SidebarNavItem from "./SidebarNavItem";

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
