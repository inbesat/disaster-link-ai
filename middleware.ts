import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Roles (mirrors lib/validations/user.ts). Keep in sync.
const ROLES = ["super_admin", "district_admin", "field_responder", "viewer"] as const;

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isGuest = request.cookies.get("guest_mode")?.value === "true";
  const adminRequested = isAdminRoute(pathname);

  // =========================================================================
  // GUEST MODE: bypass auth/session/onboarding for the read-only demo, EXCEPT
  // the admin panel — guests must never reach admin controls.
  // =========================================================================
  if (isGuest) {
    // Guests on public/auth pages are sent straight to the command center.
    if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
      const url = request.nextUrl.clone();
      url.pathname = "/command-center";
      return NextResponse.redirect(url);
    }
    if (matchesBase(pathname, "/auth")) {
      const url = request.nextUrl.clone();
      url.pathname = "/command-center";
      return NextResponse.redirect(url);
    }

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
  if (!user && (isProtected(pathname) || adminRequested)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
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