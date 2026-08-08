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
import Sidebar, { type SidebarVariant } from "./Sidebar";
import SidebarSection from "./SidebarSection";
import SidebarNavItem from "./SidebarNavItem";

type DashboardSidebarProps = {
  /** Unacknowledged AlertLog count — renders the Active Alerts pill. */
  alertsBadgeCount?: number;
  /** Active user role — filters which nav routes render (mock default). */
  userRole?: Role;
  /** Controlled collapsed state — omit for internal state. */
  collapsed?: boolean;
  /** Callback when the toggle is pressed (controlled mode). */
  onToggle?: () => void;
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
  variant = "fixed",
  className = "",
}: DashboardSidebarProps) {
  const visibleRoutes = filterRoutesByRole(NAVIGATION_ROUTES, userRole);

  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      variant={variant}
      className={className}
    >
      {NAV_SECTIONS.map((section) => {
        const sectionRoutes = visibleRoutes.filter((route) => route.section === section);
        // Skip empty sections so a filtered-out group leaves no stray divider.
        if (sectionRoutes.length === 0) return null;

        return (
          <SidebarSection key={section} label={NAV_SECTION_LABELS[section]}>
            {sectionRoutes.map((route) => (
              <SidebarNavItem
                key={route.label}
                icon={route.icon}
                label={route.label}
                href={route.href}
                badgeCount={route.href === "/alerts" ? alertsBadgeCount : undefined}
              />
            ))}
          </SidebarSection>
        );
      })}
    </Sidebar>
  );
}

export default DashboardSidebar;
