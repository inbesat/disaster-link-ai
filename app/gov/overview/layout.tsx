import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/validations/user";
import DashboardShell from "@/components/navigation/DashboardShell";
import OfflineBanner from "@/components/ui/OfflineBanner";
import QuickActionDock from "@/components/gov/dashboard/QuickActionDock";

// ---------------------------------------------------------------------
// app/gov/overview/layout.tsx — Phase 7 · Step 10 · Multi-District
// Overview shell.
//
// State-HQ comparison page. Wraps the same Phase 2 DashboardShell as the
// Command Center (sidebar rail + top bar + mobile nav), but the page is
// STRICTLY super_admin: any other gov role (district_admin,
// field_responder) is bounced back to the district Command Center. The
// middleware (middleware.ts) enforces the same gate on the wire; this
// server-side whitelist is the second line of defence.
// ---------------------------------------------------------------------

export default function GovOverviewLayout({ children }: { children: ReactNode }) {
  const role = cookies().get("role")?.value as Role | undefined;

  // Super admin is the only role admitted past this point.
  if (role !== "super_admin") redirect("/gov/dashboard");

  return (
    <>
      <DashboardShell
        guest={false}
        userRole={role}
        displayName="State HQ — Super Admin"
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
