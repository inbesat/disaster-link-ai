// ---------------------------------------------------------------------
// lib/security/require-role.ts — Step 7 · Government API role guard
//
// requireRole(allowedRoles) resolves the caller's role the same way the
// middleware does — Supabase profile when configured, the demo `role`
// cookie otherwise — and admits the request only when the role is in the
// allow-list. Guests (guest_mode cookie) and unauthenticated or
// under-privileged callers are rejected with the proper 401/403 status.
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
 * - Supabase configured: reads profile.role from the `users` table, falling
 *   back to the demo `role` cookie when the session has no profile (demo gov
 *   logins don't create Supabase users — same tolerance the chat route uses).
 * - Cookie-only demo mode (no Supabase env): the `role` cookie is the auth
 *   signal, exactly as in middleware.ts.
 *
 * Guests never pass: the public Citizen App has its own read-only endpoints.
 *
 * DEMO NOTE: when Supabase is configured, a request with no session (or a
 * failed lookup) still falls back to the `role` cookie — a deliberate
 * tolerance so demo gov logins work, mirroring app/api/chat. That is an
 * auth bypass the moment real auth is enforced; before production, drop the
 * cookie fallbacks and fail closed (401).
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

    if (!user) {
      return cookieAdmitted ? { ok: true, role: roleCookie } : deny(false);
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile?.role as string | undefined) ?? roleCookie;
    return allowedRoles.includes(role) ? { ok: true, role } : deny(true);
  } catch (error) {
    // Supabase unreachable — fall back to the demo cookie rather than
    // failing closed on a cold start.
    console.error("[requireRole] Supabase lookup failed; using role cookie.", error);
    return cookieAdmitted ? { ok: true, role: roleCookie } : deny(cookieAdmitted);
  }
}
