import type { ReactNode } from "react";
import { cookies } from "next/headers";
import type { Role } from "@/lib/validations/user";
import DashboardShell from "@/components/navigation/DashboardShell";
import OfflineBanner from "@/components/ui/OfflineBanner";
import QuickActionDock from "@/components/gov/dashboard/QuickActionDock";

const GOV_ROLES: Role[] = ["field_responder", "district_admin", "super_admin"];
const DEFAULT_ROLE: Role = "district_admin";

export default function GovMissingPersonsLayout({ children }: { children: ReactNode }) {
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
      <QuickActionDock />
    </>
  );
}
