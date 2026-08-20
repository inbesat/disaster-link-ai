// ---------------------------------------------------------------------
// lib/security/require-role.ts — Step 7 · Government API role guard
//
// requireRole(allowedRoles) resolves the caller's role the same way the
// middleware does — Supabase profile when configured, the demo `role`
// cookie otherwise — and admits the request only when the role is in the
// allow-list. Guests (guest_mode cookie) and unauthenticated or
// under-privileged callers are rejected with the proper 401/403 status.
//
// Session resolution mirrors middleware.ts + app/(admin)/layout.tsx: a
// real Supabase user is judged by their profile row, and when there is NO
// Supabase session the `role` cookie (written by govLogin/govDemoLogin)
// is the auth signal — so the demo admin APIs work while Supabase env
// vars are present but unused. A real logged-in user is NEVER overridden
// by the cookie (profile wins, fail-closed on missing profile).
//
//   const auth = await requireRole(GOV_ROLES);
//   if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
// ---------------------------------------------------------------------

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type RequireRoleResult =
  { ok: true; role: string } | { ok: false; status: 401 | 403; error: string };

function deny(authenticated: boolean): RequireRoleResult {
  return authenticated
    ? {
        ok: false,
        status: 403,
        error: "Forbidden: your role does not have access to this endpoint.",
      }
    : {
        ok: false,
        status: 401,
        error: "Unauthorized: a government session is required.",
      };
}

/**
 * Resolve the caller's role and check it against the allow-list.
 *
 * - Supabase configured + real user: profile.role from the `users` table
 *   decides (missing profile or failed lookup fails closed, 401).
 * - Supabase configured but NO signed-in user: the `role` cookie is the auth
 *   signal — the demo cookie session (govDemoLogin / govLogin), exactly as
 *   middleware.ts and the admin layout treat it. Guests still never pass.
 * - Cookie-only demo mode (no Supabase env): the `role` cookie is the auth
 *   signal, as before.
 *
 * Guests never pass: the public Citizen App has its own read-only endpoints.
 */
export async function requireRole(
  allowedRoles: readonly string[],
): Promise<RequireRoleResult> {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("role")?.value ?? "";
  const isGuest = cookieStore.get("guest_mode")?.value === "true";

  if (isGuest) return deny(false);

  const cookieAdmitted = roleCookie !== "" && allowedRoles.includes(roleCookie);

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return cookieAdmitted ? { ok: true, role: roleCookie } : deny(cookieAdmitted);
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // No real Supabase session — admit the demo cookie session (same rule
    // as middleware.ts / the admin layout). A real user is never overridden
    // by the cookie: once `user` exists, the profile row below decides.
    if (!user) {
      return cookieAdmitted ? { ok: true, role: roleCookie } : deny(false);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role as string | undefined;
    if (!role) return deny(true);
    return allowedRoles.includes(role) ? { ok: true, role } : deny(true);
  } catch (error: unknown) {
    console.error("[requireRole] Supabase lookup failed; denying access.", error);
    return deny(false);
  }
}

/**
 * requireSession() — weaker sibling of requireRole(): admits ANY signed-in
 * identity (guest_mode cookie, role cookie, or Supabase user) so citizen-facing
 * endpoints (SOS, missing-person reports, chat, social-ingest parse) keep
 * working for demo guests while still blocking fully anonymous callers from
 * mutating data. Role-based endpoints must keep using requireRole() instead.
 */
export async function requireSession(): Promise<RequireRoleResult> {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get("role")?.value ?? "";
  const isGuest = cookieStore.get("guest_mode")?.value === "true";

  if (isGuest || roleCookie !== "") return { ok: true, role: roleCookie || "guest" };

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return deny(false);
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { ok: true, role: user.id } : deny(false);
  } catch (error: unknown) {
    console.error("[requireSession] Supabase lookup failed; denying access.", error);
    return deny(false);
  }
}
