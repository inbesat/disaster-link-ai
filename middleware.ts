import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Roles (mirrors lib/validations/user.ts). Keep in sync.
const ROLES = ["super_admin", "district_admin", "field_responder", "viewer"] as const;

// Phase 1 · Dual-Mode (mirrors the UserRole enum in prisma/schema.prisma).
// The mock `role` cookie is written by publicOtpLogin (role=public) and
// govLogin (role=district_admin) in app/actions/auth.ts.
const PUBLIC_ROLE = "public";
const GOV_ROLES = ["field_responder", "district_admin", "super_admin"] as const;

// Path prefixes requiring a user (authenticated or guest).
const PROTECTED_PATHS = [
  "/command-center",
  "/field",
  "/shelter-update",
  "/shelters",
  "/evacuations",
  "/ai-planner",
  "/settings",
];

// Phase 1 · Dual-mode dashboards. "Unauthenticated" here means no guest_mode
// cookie, no role cookie, and (when Supabase is configured) no session user —
// visitors matching none of those are bounced to "/".
const DASHBOARD_PATHS = ["/public/dashboard", "/gov/dashboard"] as const;

// ---------------------------------------------------------------------------
// ADMIN ROUTES (Phase 18). These back the Admin Control Panel. Access is
// STRICT: only super_admin and district_admin pass; everyone else (including
// demo guests) is bounced to /403. The matcher in `config` below must also
// list each of these so this middleware actually runs for them.
// ---------------------------------------------------------------------------
const ADMIN_BASES = [
  "/admin",
  "/dashboard",
  "/users",
  "/districts",
  "/bulk-ops",
  "/analytics",
  "/audit-logs",
  "/health",
  // Settings · admin-only sections (Organization, Integrations). Non-admin
  // roles and guests are bounced to /403 here, like every other admin route.
  "/settings/organization",
  "/settings/integrations",
] as const;

const ADMIN_ROLES = ["super_admin", "district_admin"] as const;

type Role = (typeof ROLES)[number];

function matchesBase(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some((base) => matchesBase(pathname, base));
}

function isAdminRoute(pathname: string) {
  return ADMIN_BASES.some((base) => matchesBase(pathname, base));
}

function isDashboard(pathname: string) {
  return DASHBOARD_PATHS.some((base) => matchesBase(pathname, base));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGuest = request.cookies.get("guest_mode")?.value === "true";
  const role = request.cookies.get("role")?.value ?? "";
  const viewAsPublic = request.cookies.get("view_as_public")?.value === "true";
  const adminRequested = isAdminRoute(pathname);

  const isPublicRole = role === PUBLIC_ROLE;
  const isGovRole = (GOV_ROLES as readonly string[]).includes(role);
  const isOnGov = pathname === "/gov" || pathname.startsWith("/gov/");
  const isOnPublic = pathname === "/public" || pathname.startsWith("/public/");

  // =========================================================================
  // PHASE 1 · DUAL-MODE CROSSOVER GUARDS — users cannot slip into the wrong
  // mode. A public citizen visiting any /gov/* route is sent to the citizen
  // dashboard; a gov user visiting /public/* is sent back to the gov
  // dashboard UNLESS they hold the special view_as_public=true cookie.
  // =========================================================================
  if (isPublicRole && isOnGov) {
    const url = request.nextUrl.clone();
    url.pathname = "/public/dashboard";
    return NextResponse.redirect(url);
  }

  if (isGovRole && !viewAsPublic && isOnPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/gov/dashboard";
    return NextResponse.redirect(url);
  }

  // =========================================================================
  // GUEST MODE: bypass auth/session/onboarding for the read-only demo, EXCEPT
  // the admin panel — guests must never reach admin controls.
  // =========================================================================
  if (isGuest) {
    // Guests on public/auth pages are sent to the appropriate landing spot:
    // a public guest (role=public, from enableGuestMode) goes to the citizen
    // dashboard; other guests keep the command-center target.
    if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = role === PUBLIC_ROLE ? "/public/dashboard" : "/command-center";
      return NextResponse.redirect(url);
    }
    if (matchesBase(pathname, "/auth")) {
      const url = request.nextUrl.clone();
      url.pathname = role === PUBLIC_ROLE ? "/public/dashboard" : "/command-center";
      return NextResponse.redirect(url);
    }
    // Note: /public/login is deliberately NOT bounced here — the guest banner
    // invites guests to sign up, and publicOtpLogin upgrades them to a full
    // citizen session (it deletes guest_mode itself).

    // Strict: guests are never admitted to admin routes.
    if (adminRequested) {
      const url = request.nextUrl.clone();
      url.pathname = "/403";
      return NextResponse.redirect(url);
    }

    // Everything else passes straight through.
    return NextResponse.next();
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    // Cookie-only auth mode (no Supabase configured): the role cookie is the
    // auth signal — dual-mode dashboards still require it.
    if (isDashboard(pathname) && !role) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Any protected OR admin route requires an authenticated user.
  if (!user) {
    // Phase 1 · Dual-mode dashboards accept the mock role cookie as a valid
    // session (citizen/gov logins don't create Supabase users in the demo).
    if (isDashboard(pathname) && !role) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    if (isProtected(pathname) || adminRequested) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (user) {
    let role: Role | null = null;
    try {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      role =
        profile && ROLES.includes(profile.role as Role) ? (profile.role as Role) : null;
    } catch (error) {
      console.error("Failed to resolve user role in middleware:", error);
    }

    // Admin routes: strict role enforcement.
    if (adminRequested) {
      // A logged-in user without a completed profile must finish onboarding.
      if (!role) {
        const url = request.nextUrl.clone();
        url.pathname = "/profile-setup";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
      }
      if (!ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number])) {
        const url = request.nextUrl.clone();
        url.pathname = "/403";
        return NextResponse.redirect(url);
      }
    }

    // General protected routes: onboard users without a role.
    if (isProtected(pathname) && !role) {
      const url = request.nextUrl.clone();
      url.pathname = "/profile-setup";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/auth/:path*",
    // Phase 1 · Dual-Mode routes (crossover guards + dashboard protection)
    "/gov/:path*",
    "/public/:path*",
    "/command-center/:path*",
    "/dashboard/:path*",
    "/users/:path*",
    "/districts/:path*",
    "/bulk-ops/:path*",
    "/analytics/:path*",
    "/audit-logs/:path*",
    "/health/:path*",
    "/admin/:path*",
    "/field/:path*",
    "/shelter-update",
    "/shelters",
    "/evacuations",
    "/ai-planner",
    "/settings/:path*",
    "/settings/organization/:path*",
    "/settings/integrations/:path*",
  ],
};
