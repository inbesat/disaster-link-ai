import Link from "next/link";
import { cookies } from "next/headers";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import ProfileMenu, {
  type PublicIdentity,
} from "@/components/public/ProfileMenu";

// ---------------------------------------------------------------------
// components/public/PublicNavbar.tsx — server-component navbar for the
// citizen dashboard.
//
// Resolves the visitor's identity once per request:
//   1. guest_mode=true        → Guest (grey silhouette avatar)
//   2. Supabase session       → Logged-in user (name / email / avatar)
//   3. citizen_phone cookie   → Signed-in citizen (OTP flow)
//   4. anything else          → safe Guest fallback
// and renders a matching avatar dropdown (see ProfileMenu).
// ---------------------------------------------------------------------

async function resolveUserIdentity(
  phone: string,
  role: string,
): Promise<PublicIdentity> {
  // Real Supabase session — richest identity (name + email + avatar).
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profile } = await supabase
        .from("users")
        .select("name, email, avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();

      const name =
        profile?.name ??
        (authUser.user_metadata?.full_name as string | undefined) ??
        authUser.email?.split("@")[0] ??
        "User";
      const email = profile?.email ?? authUser.email ?? "";
      const avatarUrl = profile?.avatar_url ?? null;

      return { mode: "user", name, email, avatarUrl };
    }
  } catch (error) {
    console.warn(
      "[PublicNavbar] supabase unavailable — falling back to cookies:",
      error,
    );
  }

  // Citizen OTP session (publicOtpLogin) — no Supabase session, but the
  // visitor is signed in via the citizen_phone cookie.
  if (role === "public") {
    const masked = phone
      ? `+91 ${phone.slice(-4).padStart(4, "•")}`
      : "Citizen";
    return { mode: "user", name: "Citizen", email: masked, avatarUrl: null };
  }

  // Middleware normally prevents this state; treat it as a Guest.
  return { mode: "guest" };
}

export default async function PublicNavbar() {
  const cookieStore = cookies();
  const isGuest = cookieStore.get("guest_mode")?.value === "true";
  const phone = cookieStore.get("citizen_phone")?.value ?? "";
  const role = cookieStore.get("role")?.value ?? "";

  const identity: PublicIdentity = isGuest
    ? { mode: "guest" }
    : await resolveUserIdentity(phone, role);

  const statusLabel =
    identity.mode === "guest"
      ? "GUEST MODE"
      : phone
        ? `+91 ${phone.slice(-4).padStart(4, "•")}`
        : identity.email || identity.name;

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-red-500" />
        <span className="text-sm font-bold tracking-tight text-white">
          Citizen Portal
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="eoc-label hidden text-[var(--dl-text-muted)] sm:block">
          {statusLabel}
        </span>
        {/* Phase 13 · Step 2 — settings (low-bandwidth toggle lives there) */}
        <Link
          href="/public/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--dl-text-muted)] transition hover:border-[var(--dl-orange)]/60 hover:text-white"
        >
          <Settings aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          href="/"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:border-[var(--dl-blue)]/60 hover:text-white"
        >
          Home
        </Link>
        <ProfileMenu identity={identity} />
      </div>
    </header>
  );
}