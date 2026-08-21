import type { ReactNode } from "react";
import { cookies } from "next/headers";
import type { Role } from "@/lib/validations/user";
import DashboardShell from "@/components/navigation/DashboardShell";
import OfflineBanner from "@/components/ui/OfflineBanner";
import QuickActionDock from "@/components/gov/dashboard/QuickActionDock";

// ---------------------------------------------------------------------
// app/gov/resources/layout.tsx — Phase 10 · Step 1 · Resource & Team
// Management shell.
//
// Wraps the resource inventory pages in the same Phase 2 DashboardShell
// (sidebar rail + top bar + mobile nav) as the Command Center, so the
// logistics backbone gets the identical tactical chrome. Gov access is
// enforced by the middleware's /gov/* crossover guards (the `role`
// cookie written by the gov login).
// ---------------------------------------------------------------------

// Roles the middleware lets onto /gov/* (mirrors middleware.ts GOV_ROLES).
const GOV_ROLES: Role[] = ["field_responder", "district_admin", "super_admin"];

// Default sidebar role — the gov login writes district_admin.
const DEFAULT_ROLE: Role = "district_admin";

export default function GovResourcesLayout({ children }: { children: ReactNode }) {
  const rawRole = cookies().get("role")?.value;
  const role: Role = GOV_ROLES.includes(rawRole as Role)
    ? (rawRole as Role)
    : DEFAULT_ROLE;

  return (
    <>
      <DashboardShell
        guest={false}
        userRole={role}
        displayName="District Control Room"
        email={null}
        avatarUrl={null}
      >
        {children}
      </DashboardShell>

      <OfflineBanner />

      {/* Phase 7 · Step 7 — floating quick-action speed dial (bottom-right). */}
      <QuickActionDock />
    </>
  );
}
