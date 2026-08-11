// ---------------------------------------------------------------------
// lib/security/middleware.test.ts — Phase 1 · Step 11 · role-based
// redirects, dual-mode crossover guards, guest-mode restrictions and
// admin-route bounces.
//
// The middleware is exercised directly with real NextRequest objects
// carrying a Cookie header; NextResponse redirects are asserted via the
// Location header. `@supabase/ssr` is mocked so no network/edge runtime
// is touched. Two env modes mirror the app's auth states:
//   • cookie-only demo mode (no Supabase env) — role/guest cookies are
//     the entire auth signal;
//   • Supabase mode — getUser + profile role resolve the identity.
// ---------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: maybeSingleMock })),
      })),
    })),
  })),
}));

import { middleware } from "@/middleware";

const BASE = "https://demo.local";

function makeRequest(pathname: string, cookies: Record<string, string> = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
  return new NextRequest(`${BASE}${pathname}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

function locationOf(response: Response): string | null {
  return response.headers.get("location");
}

beforeEach(() => {
  getUserMock.mockReset();
  maybeSingleMock.mockReset();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("dual-mode crossover guards (Phase 1 · Step 7)", () => {
  it("bounces a public citizen off every /gov/* route to the citizen dashboard", async () => {
    const res = await middleware(makeRequest("/gov/dashboard", { role: "public" }));
    expect(locationOf(res)).toBe(`${BASE}/public/dashboard`);
  });

  it("bounces a gov official off /public/* to the gov dashboard", async () => {
    const res = await middleware(
      makeRequest("/public/dashboard", { role: "district_admin" }),
    );
    expect(locationOf(res)).toBe(`${BASE}/gov/dashboard`);
  });

  it("lets a gov official preview /public/* while view_as_public=true", async () => {
    const res = await middleware(
      makeRequest("/public/dashboard", {
        role: "district_admin",
        view_as_public: "true",
      }),
    );
    expect(locationOf(res)).toBeNull();
  });

  it("allows a public citizen on their own dashboard", async () => {
    const res = await middleware(makeRequest("/public/dashboard", { role: "public" }));
    expect(locationOf(res)).toBeNull();
  });
});

describe("guest mode restrictions (Phase 1 · Step 9)", () => {
  it("redirects guests on /login to the citizen dashboard when role=public", async () => {
    const res = await middleware(
      makeRequest("/login", { guest_mode: "true", role: "public" }),
    );
    expect(locationOf(res)).toBe(`${BASE}/public/dashboard`);
  });

  it("redirects guests on /login to the command center otherwise", async () => {
    const res = await middleware(makeRequest("/login", { guest_mode: "true" }));
    expect(locationOf(res)).toBe(`${BASE}/command-center`);
  });

  it("lets guests browse the citizen dashboard", async () => {
    const res = await middleware(
      makeRequest("/public/dashboard", { guest_mode: "true", role: "public" }),
    );
    expect(locationOf(res)).toBeNull();
  });

  it("never admits guests to admin routes — bounces to /403", async () => {
    const res = await middleware(
      makeRequest("/admin/users", { guest_mode: "true" }),
    );
    expect(locationOf(res)).toBe(`${BASE}/403`);
  });
});

describe("cookie-only demo mode dashboard guard", () => {
  it("bounces unauthenticated visitors away from the dual-mode dashboards", async () => {
    const res = await middleware(makeRequest("/public/dashboard"));
    expect(locationOf(res)).toBe(`${BASE}/`);
    const gov = await middleware(makeRequest("/gov/dashboard"));
    expect(locationOf(gov)).toBe(`${BASE}/`);
  });
});

describe("/gov/overview super_admin gate (Phase 7 · Step 10)", () => {
  it("bounces non-super_admin roles to the district command center", async () => {
    const res = await middleware(
      makeRequest("/gov/overview", { role: "district_admin" }),
    );
    expect(locationOf(res)).toBe(`${BASE}/gov/dashboard`);
  });

  it("admits super_admin", async () => {
    const res = await middleware(makeRequest("/gov/overview", { role: "super_admin" }));
    expect(locationOf(res)).toBeNull();
  });
});

describe("Supabase mode (env configured)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://demo.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  });

  it("admits a logged-in admin to an admin route", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    maybeSingleMock.mockResolvedValue({ data: { role: "super_admin" }, error: null });
    const res = await middleware(makeRequest("/admin/users"));
    expect(locationOf(res)).toBeNull();
  });

  it("bounces a non-admin role off admin routes to /403", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    maybeSingleMock.mockResolvedValue({ data: { role: "field_responder" }, error: null });
    const res = await middleware(makeRequest("/admin/users"));
    expect(locationOf(res)).toBe(`${BASE}/403`);
  });

  it("sends a session without a profile to /profile-setup for protected routes", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const res = await middleware(makeRequest("/command-center"));
    // The `next` query param is URL-encoded by searchParams.set — compare
    // the decoded pathname for readability.
    expect(decodeURIComponent(locationOf(res) ?? "")).toBe(
      `${BASE}/profile-setup?next=/command-center`,
    );
  });

  it("redirects unauthenticated requests on protected routes to /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const res = await middleware(makeRequest("/command-center"));
    expect(decodeURIComponent(locationOf(res) ?? "")).toBe(
      `${BASE}/login?next=/command-center`,
    );
  });

  it("admits a role-cookie session on protected routes without a Supabase user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    for (const path of ["/dashboard", "/command-center", "/inventory", "/alerts"]) {
      const res = await middleware(makeRequest(path, { role: "district_admin" }));
      expect(locationOf(res)).toBeNull();
    }
  });

  it("admits a role-cookie session to the admin panel only for admin roles", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const ok = await middleware(makeRequest("/users", { role: "district_admin" }));
    expect(locationOf(ok)).toBeNull();
    const denied = await middleware(makeRequest("/users", { role: "field_responder" }));
    expect(locationOf(denied)).toBe(`${BASE}/403`);
  });

  it("admits guests (guest_mode=true) to protected routes incl. /dashboard", async () => {
    const res = await middleware(
      makeRequest("/dashboard", { guest_mode: "true" }),
    );
    expect(locationOf(res)).toBeNull();
  });
});
