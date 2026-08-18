"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/security/rate-limit";
import { consumeOtp, generateOtp, issueOtp, normalizePhone } from "@/lib/security/otp";
import { DEMO_SESSION_COOKIE } from "@/lib/demo/scope";

const GUEST_COOKIE = "guest_mode";

// Shared cookie options for every demo session cookie. `path: "/"` is
// mandatory — without it Next.js scopes the cookie to the current route
// segment, so the session silently vanishes the moment the user switches
// pages (e.g. /dashboard ↔ /command-center /inventory) and the middleware
// bounces them back to /login. Centralised here so no login action can
// forget it.
const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

/** Set a demo session cookie with the full, site-wide options (path included). */
function setSessionCookie(name: string, value: string, maxAge: number) {
  cookies().set(name, value, { ...SESSION_COOKIE_OPTIONS, maxAge });
}

// Shared by Continue as Guest and the GetOTP demo bypass — keeps the cookie
// options (httpOnly/sameSite/secure/path/maxAge) in one place.
function setGuestCookie() {
  setSessionCookie(GUEST_COOKIE, "true", 60 * 60 * 24 * 7);
}

// ---------------------------------------------------------------------
// GetOTP passwordless responder login (Enterprise Security).
//
// Flow: sendOTP(phone) → GetOTP sends a 6-digit code by SMS; the user
// types it into the login page; verifyOTP(code) validates it and signs
// the responder in.
//
// CRITICAL HACKATHON FALLBACK: if GETOTP_API_KEY is missing the OTP is
// never sent — we console.log it instead and simulate success so the demo
// keeps working. The same fallback triggers on any API failure.
//
// GetOTP API (api.otp.dev): POST /v1/verifications with an X-OTP-Key
// header. We generate the code locally and pass it as the `code` field so
// the SMS always carries OUR code and verification stays a simple
// in-memory lookup (plus an optional Supabase sign-in attempt).
// ---------------------------------------------------------------------

const GETOTP_SEND_URL =
  process.env.GETOTP_SEND_URL ?? "https://api.otp.dev/v1/verifications";
const GETOTP_CHANNEL = process.env.GETOTP_CHANNEL ?? "sms";
const GETOTP_SENDER = process.env.GETOTP_SENDER ?? "GetOTP";

/**
 * Send a 6-digit OTP to the given phone number via GetOTP.
 * Fails open: missing key or API error → log the code and simulate success.
 */
export async function sendOTP(
  phoneNumber: string,
): Promise<{ ok: boolean; message: string }> {
  const phone = normalizePhone(phoneNumber);
  if (!phone) {
    return {
      ok: false,
      message: "Enter a valid phone number (digits only, with country code).",
    };
  }

  // Abuse guard: max 3 send requests per phone per 10 minutes (reuses the
  // shared in-memory rate limiter from lib/security/rate-limit.ts).
  const sendBudget = rateLimit(`getotp:send:${phone}`, 3, 10 * 60 * 1000);
  if (!sendBudget.success) {
    return {
      ok: false,
      message: "Too many OTP requests. Wait a few minutes and try again.",
    };
  }

  const code = generateOtp(6);
  const apiKey = process.env.GETOTP_API_KEY;

  if (!apiKey) {
    console.log(`[getotp] DEMO — no GETOTP_API_KEY. OTP for ${phone}: ${code}`);
    issueOtp(code, phone);
    return {
      ok: true,
      message: "OTP sent (demo) — check the server console for the code.",
    };
  }

  try {
    const res = await fetch(GETOTP_SEND_URL, {
      method: "POST",
      headers: {
        "X-OTP-Key": apiKey,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        data: {
          channel: GETOTP_CHANNEL,
          sender: GETOTP_SENDER,
          phone,
          // Template UUID comes from the GetOTP dashboard. Until a real
          // template is configured the API rejects the call and we fall
          // back to the demo path below.
          ...(process.env.GETOTP_TEMPLATE_ID
            ? { template: process.env.GETOTP_TEMPLATE_ID }
            : {}),
          code,
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`GetOTP returned ${res.status}`);

    issueOtp(code, phone);
    return { ok: true, message: "OTP sent to your phone. It expires in 5 minutes." };
  } catch (error) {
    console.warn("[getotp] API call failed — simulating success.", error);
    console.log(`[getotp] DEMO FALLBACK — OTP for ${phone}: ${code}`);
    issueOtp(code, phone);
    return {
      ok: true,
      message: "OTP sent (fallback demo) — check the server console for the code.",
    };
  }
}

/**
 * Verify the OTP code and sign the responder in.
 * On success, tries a real Supabase phone login first; falls back to the
 * guest_mode cookie (demo bypass) when that is not possible.
 */
export async function verifyOTP(code: string): Promise<{ ok: false; message: string }> {
  const token = (code ?? "").trim().replace(/\D/g, "");
  if (!/^\d{6}$/.test(token)) {
    return { ok: false, message: "Enter the 6-digit code from your phone." };
  }

  // Brute-force guard: max 5 verify attempts per code per minute.
  const attemptBudget = rateLimit(`getotp:verify:${token}`, 5, 60 * 1000);
  if (!attemptBudget.success) {
    return { ok: false, message: "Too many attempts. Request a new code." };
  }

  // Consume the code (single-use). null for unknown/expired/malformed.
  const phone = consumeOtp(token);
  if (!phone) {
    return { ok: false, message: "Invalid or expired code. Request a new one." };
  }

  // Real-mode path: the phone must be a Supabase Auth user that received a
  // matching code. Since GetOTP (not Supabase) generated this code, this
  // usually fails and we fall through to the demo guest login below.
  const realMode = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.GETOTP_API_KEY);
  if (realMode) {
    let signedIn = false;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });
      signedIn = !error;
    } catch (error) {
      console.warn(
        "[getotp] Supabase OTP sign-in failed — falling back to guest demo.",
        error,
      );
    }
    if (signedIn) redirect("/command-center");
  }

  // Demo bypass: mark the responder as a guest, exactly like Continue as Guest.
  setGuestCookie();
  redirect("/command-center");
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  // Drop the ENTIRE cookie session — not just guest_mode. The demo logins
  // (govLogin / publicOtpLogin / enableGuestMode / govDemoLogin /
  // publicDemoLogin) authenticate via the `role` cookie alone, so any
  // leftover identity cookie makes the middleware treat a "logged-out"
  // visitor as still signed in. That stale-role leak is exactly the
  // role-contamination bug: a previous role=public cookie survives the
  // logout and bounces a later /gov/* login straight back to the citizen
  // dashboard. Clear every custom marker so the next login starts clean.
  cookies().delete(GUEST_COOKIE);
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  // Hard reset to the two-door landing so no stale app state is reused.
  redirect("/");
}

// Bypass auth to demo the dashboard without a real Supabase login.
// Only used for testing — the guest is not an authenticated user.
// Always lands on /command-center: the middleware treats guests as fully
// authenticated, so the demo panel opens with no profile/session checks.
export async function setGuestMode() {
  // Guest browse mode is a separate identity — drop any citizen/gov session.
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  setGuestCookie();
  redirect("/command-center");
}

export async function clearGuestMode() {
  cookies().delete(GUEST_COOKIE);
  // Public guests also ride a role=public cookie — clear it so the exit is
  // a true logout (a stale public role cookie would pass the middleware).
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  redirect("/");
}

// ---------------------------------------------------------------------
// Public guest-mode bypass (Phase 1 · Step 9). Rapid browse-only access
// during a panic — no phone, no OTP, no account. Sets BOTH the guest_mode
// cookie AND role=public, so the middleware treats the visitor as a public
// citizen (can browse /public/* but never /gov/*). The citizen dashboard
// shows a persistent guest-mode banner while this session is active.
// ---------------------------------------------------------------------
export async function enableGuestMode() {
  // One identity per browser: drop any gov preview session.
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  // 7-day public browse session.
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  setGuestCookie();
  redirect("/public/dashboard");
}

// Exit guest browse mode: drop the guest/role session and return to the
// two-door landing page so the visitor can choose a real path.
export async function exitGuestMode() {
  cookies().delete("guest_mode");
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  redirect("/");
}

// ---------------------------------------------------------------------
// Public citizen OTP login (Phase 1 · Step 3 · Frictionless Public Auth).
//
// Citizens never type a password. The client collects the phone, swaps to a
// 6-digit OTP step, and the DEMO accepts any 6-digit code. On success this
// action "simulates user creation" by writing a `role=public` session cookie
// (the citizen's identity for the mock onboarding flow) and redirecting to
// the citizen onboarding page.
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// Government login (Phase 1 · Step 4 · Strict Gov Auth Flow).
//
// Strict, role-assigned access. The client collects email + password; the
// DEMO accepts any credentials and mocks the authenticated session by
// writing a `role` cookie, then redirects to the gov dashboard. (Real
// auth would verify against Supabase and assign the user's actual role.)
//
// Phase 7 · Step 10: the demo login page offers a role selector so judges
// can sign in as district_admin (default) or super_admin — the latter
// unlocks the Multi-District State-HQ overview at /gov/overview.
// ---------------------------------------------------------------------
export async function govLogin(role: "district_admin" | "super_admin" = "district_admin") {
  // Strict one-identity-per-browser: a gov login must NEVER inherit a
  // previous citizen/guest/demo session. Blow away every stale marker so
  // the middleware can't route this login back to /public/dashboard.
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  // 7-day gov session — explicitly overwrite `role` with the gov role.
  setSessionCookie("role", role, 60 * 60 * 24 * 7);
  redirect(role === "super_admin" ? "/gov/overview" : "/gov/dashboard");
}

// ---------------------------------------------------------------------
// Phase 2 · Step 2 — One-Tap gov demo login (two-door landing flow).
//
// The AdminDemo modal's "One-Tap Login" drops judges straight into the
// District Command Center with ZERO typing: it writes BOTH the role
// session cookie (so the middleware admits district_admin to /gov/*) and
// a `demo_mode=true` marker (the demo-session flag the landing sets on
// its local state too), then redirects to /gov/dashboard. Real auth
// would verify against Supabase — here the demo accepts the prefilled
// credentials shown on the modal.
// ---------------------------------------------------------------------
export async function govDemoLogin() {
  // One identity per browser: drop any guest/citizen session first.
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  // Short demo-session marker + the full 7-day gov role cookie. Phase 2 ·
  // Step 8 — every demo login pins a fresh session UUID so demo DB rows are
  // owned by exactly one demo session and can never leak into real views.
  setSessionCookie("demo_mode", "true", 60 * 60 * 24);
  setSessionCookie(DEMO_SESSION_COOKIE, randomUUID(), 60 * 60 * 24);
  setSessionCookie("role", "district_admin", 60 * 60 * 24 * 7);
  redirect("/gov/dashboard");
}

// ---------------------------------------------------------------------
// Phase 2 · Step 3 — One-tap citizen demo login (two-door landing flow).
//
// The PublicLoginModal's "One-Tap Experience" drops judges straight into
// the Citizen Companion app: it writes BOTH the role=public session
// cookie (so the middleware admits the citizen to /public/*) and the
// demo_mode=true marker, then lands on /public/dashboard. The prefilled
// phone/OTP/location/language shown on the modal are applied client-side
// before this action runs (localStorage `citizen_location`).
// ---------------------------------------------------------------------
export async function publicDemoLogin() {
  // One identity per browser: drop any guest/gov session first.
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  // Short demo-session marker + the full 7-day public role cookie. Phase 2 ·
  // Step 8 — the fresh UUID scopes every demo DB row to this exact session.
  setSessionCookie("demo_mode", "true", 60 * 60 * 24);
  setSessionCookie(DEMO_SESSION_COOKIE, randomUUID(), 60 * 60 * 24);
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  redirect("/public/dashboard");
}

// ---------------------------------------------------------------------
// Phase 2 · Step 6 — "Reset Demo Data" from the DemoIndicators strip.
// Clears every demo-session marker and returns to the two-door landing.
// (The client also wipes the localStorage demo seed before calling.)
// ---------------------------------------------------------------------
export async function exitDemoMode() {
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("guest_mode");
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  redirect("/demo");
}

// ---------------------------------------------------------------------
// Phase 2 · Step 10 — Demo-to-real conversion cleanup (no redirect).
//
// Called by the signup page after a judge converts to a real account: it
// clears every demo-session marker IN PLACE so the /signup flow (and its
// welcome modal) keeps rendering. The client wipes the localStorage
// scenario seed + analytics trail before calling.
// ---------------------------------------------------------------------
export async function clearDemoSession() {
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("guest_mode");
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
}

// ---------------------------------------------------------------------
// Gov "view as public" preview (Phase 1 · Step 8 · Smart Middleware).
// With view_as_public=true the middleware lets a gov user into /public/*
// (the crossover guard otherwise sends them back to /gov/dashboard).
// ---------------------------------------------------------------------
export async function setViewAsPublic() {
  // One identity per browser: a previewing official is never also a guest,
  // so the sticky preview and guest banners can never stack (Step 10).
  cookies().delete("guest_mode");
  // 24h preview session.
  setSessionCookie("view_as_public", "true", 60 * 60 * 24);
  redirect("/public/dashboard");
}

export async function clearViewAsPublic() {
  cookies().delete("view_as_public");
  redirect("/gov/dashboard");
}

export async function publicOtpLogin(phoneNumber: string) {
  const phone = (phoneNumber ?? "").trim().slice(0, 20);
  // Strict one-identity-per-browser: a public login must NEVER inherit a
  // previous gov/guest/demo session. Blow away every stale marker so the
  // middleware can't route this login back to /gov/dashboard.
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("sandbox");
  // 7-day citizen session — explicitly overwrite `role` with "public".
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  // Remember the number so the citizen onboarding step can prefill it.
  if (phone) {
    setSessionCookie("citizen_phone", phone, 60 * 60 * 24 * 7);
  }
  redirect("/public/onboarding");
}

// ---------------------------------------------------------------------
// Unified Login / Signup Server Actions (UI → Supabase Auth).
//
// These back the tabbed card on app/(auth)/login/page.tsx. All auth runs
// server-side through the Supabase server client so the session cookies
// are written by the action itself (lib/supabase/server.ts handles the
// cookie round-trip). On failure the action redirects back to
// /login?error=<message> where the card renders the message in a red
// banner; on success the user lands on /public/dashboard.
// ---------------------------------------------------------------------

/** Create an account. Full name rides in options.data.full_name so the
 *  `users` database trigger (handle_new_user) picks it up. */
export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) {
    redirect(`/login?error=${encodeURIComponent("Please enter your full name.")}`);
  }
  if (password.length < 8) {
    redirect(
      `/login?error=${encodeURIComponent("Password must be at least 8 characters long.")}`,
    );
  }

  let failure: string | null = null;
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    failure = error?.message ?? null;
  } catch (error) {
    console.error("[auth] signUpAction failed:", error);
    failure = "Could not create your account. Please try again.";
  }

  if (failure) {
    redirect(`/login?error=${encodeURIComponent(failure)}`);
  }

  redirect("/public/dashboard");
}

/** Sign an existing user in with email + password. */
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email and password are required.")}`);
  }

  let failure: string | null = null;
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    failure = error?.message ?? null;
  } catch (error) {
    console.error("[auth] signInAction failed:", error);
    failure = "Could not sign you in. Please try again.";
  }

  if (failure) {
    redirect(`/login?error=${encodeURIComponent(failure)}`);
  }

  redirect("/public/dashboard");
}

/** Continue as a temporary view-only guest. Sets guest_mode=true (plus
 *  role=public so the middleware admits the citizen dashboard) and
 *  redirects to /public/dashboard — the same session shape as the
 *  landing page's one-tap guest flow. */
export async function guestLoginAction() {
  await enableGuestMode();
}
