import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/lib/validations/user";
import { prisma } from "@/server/prisma";
import DashboardShell from "@/components/navigation/DashboardShell";
import AlertTicker from "@/components/dashboard/AlertTicker";

const OPERATIONAL_ROLES: Role[] = ROLES.filter((role) => role !== "viewer");

// Demo fallback when the DB isn't reachable — mirrors the alerts page's
// MOCK_ALERTS (2 of the 3 mock entries are unacknowledged).
const FALLBACK_ACTIVE_ALERTS = 2;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const guest = cookies().get("guest_mode")?.value === "true";

  let displayName = "Guest Commander";
  let email: string | null = null;
  let avatarUrl: string | null = null;

  if (!guest) {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/command-center");
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile?.role) {
      redirect("/profile-setup");
    }

    if (!OPERATIONAL_ROLES.includes(profile.role as (typeof ROLES)[number])) {
      redirect("/403");
    }

    const meta = user.user_metadata ?? {};
    displayName =
      (meta.name as string) || (meta.full_name as string) || (user.email ?? "Responder");
    email = user.email ?? null;
    avatarUrl = (meta.avatar_url as string) || null;
  }

  // Live "Active Alerts" badge for the sidebar nav: count unacknowledged
  // AlertLog rows, falling back to the demo number when the DB is down.
  // Guests skip the query entirely (demo mode renders with the mock count).
  let alertsBadgeCount: number | undefined;
  if (guest) {
    alertsBadgeCount = FALLBACK_ACTIVE_ALERTS;
  } else {
    try {
      alertsBadgeCount = await prisma.alertLog.count({
        where: { isAcknowledged: false },
      });
    } catch {
      alertsBadgeCount = FALLBACK_ACTIVE_ALERTS;
    }
  }

  return (
    <DashboardShell
      guest={guest}
      displayName={displayName}
      email={email}
      avatarUrl={avatarUrl}
      alertsBadgeCount={alertsBadgeCount}
    >
      <AlertTicker />
      {children}
    </DashboardShell>
  );
}
