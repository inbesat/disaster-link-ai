// ---------------------------------------------------------------------
// lib/config/navigation.ts
// Phase 2 · Step 3 — navigation data & role filtering.
//
// Single source of truth for the dashboard sidebar: every route object
// carries its Lucide icon, section group, and the list of roles allowed
// to see it. The sidebar maps over NAVIGATION_ROUTES, filters by the
// active user's role, and renders only what they can access.
//
// Role matrix:
//   field_responder → Alerts, Evacuation Routes, AI Planner, Team
//   district_admin  → + Overview, Command Center, Shelters, Resources, Satellite
//   super_admin     → everything (incl. Settings)
//
// Route targets are the REAL pages that exist today:
//   Overview       → /dashboard        (metrics overview)
//   Command Center → /command-center   (live map view)
//   Resources      → /inventory       (resource inventory)
//   Team           → /directory       (member directory)
//   Satellite      → /settings/integrations (Satellite GIS card)
// ---------------------------------------------------------------------

import {
  Bot,
  Heart,
  LayoutDashboard,
  Map,
  PackageOpen,
  Route,
  Satellite,
  Settings,
  Tent,
  TriangleAlert,
  Users,
  UserX,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/validations/user";
import type { SidebarSubRoute } from "@/components/navigation/SidebarNavItem";

/** Sidebar section groups, rendered in this order. */
export const NAV_SECTIONS = [
  "operations",
  "resources",
  "intelligence",
  "team",
  "settings",
] as const;

export type NavSection = (typeof NAV_SECTIONS)[number];

/** Human label for each section heading. */
export const NAV_SECTION_LABELS: Record<NavSection, string> = {
  operations: "Operations",
  resources: "Resources",
  intelligence: "Intelligence",
  team: "Team",
  settings: "Settings",
};

export type NavRoute = {
  /** Nav label — also the tooltip when the sidebar is collapsed. */
  label: string;
  /** Destination route. */
  href: string;
  /** Lucide icon for the nav item. */
  icon: LucideIcon;
  /** Section group the item belongs to. */
  section: NavSection;
  /** Roles permitted to see this route. */
  allowedRoles: Role[];
  /** Optional accordion sub-routes (e.g. Settings → profile/notifications/…).
   * Named `subRoutes` (not `children`) so the react/no-children-prop lint
   * rule doesn't fire — these are data, not React children. */
  subRoutes?: SidebarSubRoute[];
};

/**
 * The full nav. Order within a section defines render order; section order
 * is fixed by NAV_SECTIONS. "viewer" is intentionally absent from every
 * allowedRoles list (viewers are bounced to /403 by the dashboard layout,
 * so they never see the sidebar).
 */
export const NAVIGATION_ROUTES: NavRoute[] = [
  // ------------------------------------------------------- OPERATIONS ----
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "operations",
    allowedRoles: ["district_admin", "super_admin"],
  },
  {
    label: "Command Center",
    href: "/command-center",
    icon: Map,
    section: "operations",
    allowedRoles: ["district_admin", "super_admin"],
  },
  {
    label: "Alerts",
    href: "/alerts",
    icon: TriangleAlert,
    section: "operations",
    allowedRoles: ["field_responder", "district_admin", "super_admin"],
  },
  {
    label: "Evacuation Routes",
    href: "/evacuations",
    icon: Route,
    section: "operations",
    allowedRoles: ["field_responder", "district_admin", "super_admin"],
  },
  {
    label: "Shelters",
    href: "/shelters",
    icon: Tent,
    section: "operations",
    allowedRoles: ["district_admin", "super_admin"],
  },
  {
    label: "Missing Persons",
    href: "/missing-persons",
    icon: UserX,
    section: "operations",
    allowedRoles: ["field_responder", "district_admin", "super_admin"],
  },
  {
    label: "Casualty Tracking",
    href: "/casualties",
    icon: Stethoscope,
    section: "operations",
    allowedRoles: ["field_responder", "district_admin", "super_admin"],
  },
  // -------------------------------------------------------- RESOURCES ----
  {
    label: "Resources",
    href: "/inventory",
    icon: PackageOpen,
    section: "resources",
    allowedRoles: ["district_admin", "super_admin"],
  },
  {
    label: "NGO Portal",
    href: "/ngo-portal",
    icon: Heart,
    section: "resources",
    allowedRoles: ["field_responder", "district_admin", "super_admin"],
  },
  // ----------------------------------------------------- INTELLIGENCE ----
  {
    label: "AI Planner",
    href: "/ai-planner",
    icon: Bot,
    section: "intelligence",
    allowedRoles: ["field_responder", "district_admin", "super_admin"],
  },
  {
    label: "Satellite",
    href: "/settings/integrations",
    icon: Satellite,
    section: "intelligence",
    allowedRoles: ["district_admin", "super_admin"],
  },
  // ------------------------------------------------------------- TEAM ----
  {
    label: "Team",
    href: "/directory",
    icon: Users,
    section: "team",
    allowedRoles: ["field_responder", "district_admin", "super_admin"],
  },
  // --------------------------------------------------------- SETTINGS ----
  {
    label: "Settings",
    href: "/settings/profile",
    icon: Settings,
    section: "settings",
    allowedRoles: ["super_admin"],
    subRoutes: [
      { label: "Profile", href: "/settings/profile" },
      { label: "Notifications", href: "/settings/notifications" },
      { label: "Map", href: "/settings/map" },
      { label: "AI", href: "/settings/ai" },
    ],
  },
];

/** Routes a role can see, in config order. */
export function filterRoutesByRole(routes: NavRoute[], role: Role): NavRoute[] {
  return routes.filter((route) => route.allowedRoles.includes(role));
}
