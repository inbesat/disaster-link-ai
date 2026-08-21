import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/validations/user";
import { prisma } from "@/server/prisma";
import DashboardShell from "@/components/navigation/DashboardShell";
import OfflineBanner from "@/components/ui/OfflineBanner";

const OPERATIONAL_ROLES: Role[] = ROLES.filter((role) => role !== "viewer");

// Demo fallback when the DB isn't reachable — mirrors the alerts page's
// MOCK_ALERTS (2 of the 3 mock entries are unacknowledged).
const FALLBACK_ACTIVE_ALERTS = 2;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const guest = cookies().get("guest_mode")?.value === "true";
  // A `role` cookie alone is a valid demo session (govLogin/publicOtpLogin
  // write it without creating a Supabase user) — without this fallback the
  // user gets bounced to /login on every protected route change.
  const roleCookie = cookies().get("role")?.value;

  let displayName = "Guest Commander";
  let email: string | null = null;
  let avatarUrl: string | null = null;
  // Sidebar nav role — guests get the demo default; real users their own.
  let userRole: Role = "district_admin";

  if (!guest) {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
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
      userRole = profile.role as Role;

      const meta = user.user_metadata ?? {};
      displayName =
        (meta.name as string) || (meta.full_name as string) || (user.email ?? "Responder");
      email = user.email ?? null;
      avatarUrl = (meta.avatar_url as string) || null;
    } else if (roleCookie && (ROLES as readonly string[]).includes(roleCookie)) {
      // Demo cookie-only session: no Supabase user, but the middleware's
      // `role` cookie is the auth signal. Use it for the sidebar nav.
      userRole = roleCookie as Role;
      displayName = ROLE_LABELS[userRole];
    } else {
      redirect("/login?next=/command-center");
    }
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
    <>
      <DashboardShell
        guest={guest}
        userRole={userRole}
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
        alertsBadgeCount={alertsBadgeCount}
      >
        {children}
      </DashboardShell>

      {/* Phase 9 · Step 9 — amber offline strip, drops from the viewport
          top while the network is down (dashboard scope — the field app
          mounts its own field-specific banner). Fixed, so placement is
          free. */}
      <OfflineBanner />
    </>
  );
}
