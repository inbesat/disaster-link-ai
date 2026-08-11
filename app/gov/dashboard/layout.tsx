import type { ReactNode } from "react";
import { cookies } from "next/headers";
import type { Role } from "@/lib/validations/user";
import DashboardShell from "@/components/navigation/DashboardShell";
import AlertTicker from "@/components/dashboard/AlertTicker";
import OfflineBanner from "@/components/ui/OfflineBanner";
import QuickActionDock from "@/components/gov/dashboard/QuickActionDock";

// ---------------------------------------------------------------------
// app/gov/dashboard/layout.tsx — Phase 7 · Step 1 · Gov Command Center
// layout shell.
//
// Wraps the government dashboard in the Phase 2 DashboardShell — the
// composed Sidebar rail (role-filtered nav, collapsible, mobile drawer)
// plus the dashboard top bar and mobile bottom nav — so the gov command
// center gets the exact same tactical chrome as the rest of the app.
//
// The gov login (app/actions/auth.ts → govLogin) writes a `role` cookie
// (district_admin / field_responder / super_admin), which is read here
// server-side to filter the sidebar routes. No Supabase dependency: the
// gov flow is cookie-authenticated (see middleware.ts GOV_ROLES).
// ---------------------------------------------------------------------

// Roles the middleware lets onto /gov/* (mirrors middleware.ts GOV_ROLES).
const GOV_ROLES: Role[] = ["field_responder", "district_admin", "super_admin"];

// Default sidebar role — the gov login writes district_admin.
const DEFAULT_ROLE: Role = "district_admin";

export default function GovDashboardLayout({ children }: { children: ReactNode }) {
  // Whitelist the cookie value (a stray "public" cookie from the citizen
  // flow must never type-cast into an empty sidebar).
  const rawRole = cookies().get("role")?.value;
  const role: Role = GOV_ROLES.includes(rawRole as Role) ? (rawRole as Role) : DEFAULT_ROLE;

  return (
    <>
      <DashboardShell
        guest={false}
        userRole={role}
        displayName="District Control Room"
        email={null}
        avatarUrl={null}
      >
        <AlertTicker />
        {children}
      </DashboardShell>

      {/* Phase 9 · Step 9 — amber offline strip (shared dashboard scope). */}
      <OfflineBanner />

      {/* Phase 7 · Step 7 — floating quick-action speed dial (bottom-right). */}
      <QuickActionDock />
    </>
  );
}
