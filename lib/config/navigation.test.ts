// ---------------------------------------------------------------------
// lib/config/navigation.test.ts
// Tests for the Phase 2 · Step 3 nav config: every route declares its
// allowedRoles, the filter helper yields exactly the expected set per
// role, and no route is orphaned (no allowed roles) or duplicated in a
// way that breaks React keys.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { NAV_SECTIONS, NAVIGATION_ROUTES, filterRoutesByRole } from "./navigation";
import type { Role } from "@/lib/validations/user";

/** Convenience: labels a role can see, in config order. */
function labelsFor(role: Role): string[] {
  return filterRoutesByRole(NAVIGATION_ROUTES, role).map((route) => route.label);
}

describe("NAVIGATION_ROUTES", () => {
  it("defines the required routes (current config)", () => {
    expect(NAVIGATION_ROUTES).toHaveLength(16);
    const labels = NAVIGATION_ROUTES.map((route) => route.label);
    expect(labels).toEqual([
      "Overview",
      "Command Center",
      "Global Map",
      "Alerts & Notifications",
      "Shelters",
      "Missing Persons",
      "Casualty Tracking",
      "NGO Coordination",
      "Resources",
      "Evacuation Routes",
      "AI Emergency Planner",
      "Satellite & Ground Truth",
      "Predictions",
      "Team & Responders",
      "Access Requests",
      "Settings",
    ]);
  });

  it("gives every route at least one allowed role", () => {
    for (const route of NAVIGATION_ROUTES) {
      expect(route.allowedRoles.length).toBeGreaterThan(0);
    }
  });

  it("has unique nav labels (safe React keys)", () => {
    const labels = NAVIGATION_ROUTES.map((route) => route.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("assigns every route to a known section", () => {
    for (const route of NAVIGATION_ROUTES) {
      expect(NAV_SECTIONS).toContain(route.section);
    }
  });
});

describe("filterRoutesByRole — role matrix", () => {
  it("field_responder sees Overview, Command Center, Alerts, Evacuation Routes, AI, Team", () => {
    expect(labelsFor("field_responder")).toEqual([
      "Overview",
      "Command Center",
      "Alerts & Notifications",
      "Evacuation Routes",
      "AI Emergency Planner",
      "Team & Responders",
    ]);
  });

  it("district_admin adds Global Map, Shelters, Missing/Casualty/NGO, Resources, Satellite, Predictions, Access Requests, Settings", () => {
    expect(labelsFor("district_admin")).toEqual([
      "Overview",
      "Command Center",
      "Global Map",
      "Alerts & Notifications",
      "Shelters",
      "Missing Persons",
      "Casualty Tracking",
      "NGO Coordination",
      "Resources",
      "Evacuation Routes",
      "AI Emergency Planner",
      "Satellite & Ground Truth",
      "Predictions",
      "Team & Responders",
      "Access Requests",
      "Settings",
    ]);
  });

  it("super_admin sees everything", () => {
    expect(labelsFor("super_admin")).toHaveLength(NAVIGATION_ROUTES.length);
    expect(labelsFor("super_admin")).toContain("Settings");
  });

  it("settings is super_admin and district_admin", () => {
    const settings = NAVIGATION_ROUTES.find((r) => r.label === "Settings");
    expect(settings?.allowedRoles).toEqual(["super_admin", "district_admin"]);
  });

  it("viewer (a real Role) is not listed on any route", () => {
    for (const route of NAVIGATION_ROUTES) {
      expect(route.allowedRoles).not.toContain("viewer");
    }
    expect(filterRoutesByRole(NAVIGATION_ROUTES, "viewer")).toEqual([]);
  });

  it("role visibility is monotonic (admin ⊇ responder)", () => {
    const responder = labelsFor("field_responder");
    const admin = labelsFor("district_admin");
    const superAdmin = labelsFor("super_admin");
    for (const label of responder) expect(admin).toContain(label);
    for (const label of admin) expect(superAdmin).toContain(label);
  });
});