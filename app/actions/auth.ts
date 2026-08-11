"use server";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/security/rate-limit";

const GUEST_COOKIE = "guest_mode";

// Shared by Continue as Guest and the GetOTP demo bypass — keeps the cookie
// options (httpOnly/sameSite/secure/path/maxAge) in one place.
function setGuestCookie() {
  cookies().set(GUEST_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
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
const OTP_TTL_MS = 5 * 60 * 1000; // codes expire after 5 minutes

// code -> { phone, expiresAt } (in-memory; resets on server restart, which
// is fine for a demo — a production build would back this with a KV store).
const otpStore = new Map<string, { phone: string; expiresAt: number }>();

function generateOtp(length = 6): string {
  // Cryptographically-random digits — never Math.random for OTP material.
  let code = "";
  for (let i = 0; i < length; i++) code += randomInt(0, 10);
  return code;
}

function normalizePhone(raw: string): string | null {
  const phone = (raw ?? "").replace(/[\s\-()]/g, "");
  return /^\+?\d{7,15}$/.test(phone) ? phone : null;
}

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
    otpStore.set(code, { phone, expiresAt: Date.now() + OTP_TTL_MS });
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

    otpStore.set(code, { phone, expiresAt: Date.now() + OTP_TTL_MS });
    return { ok: true, message: "OTP sent to your phone. It expires in 5 minutes." };
  } catch (error) {
    console.warn("[getotp] API call failed — simulating success.", error);
    console.log(`[getotp] DEMO FALLBACK — OTP for ${phone}: ${code}`);
    otpStore.set(code, { phone, expiresAt: Date.now() + OTP_TTL_MS });
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

  const entry = otpStore.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    if (entry) otpStore.delete(token);
    return { ok: false, message: "Invalid or expired code. Request a new one." };
  }
  otpStore.delete(token);

  // Real-mode path: the phone must be a Supabase Auth user that received a
  // matching code. Since GetOTP (not Supabase) generated this code, this
  // usually fails and we fall through to the demo guest login below.
  const realMode = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.GETOTP_API_KEY);
  if (realMode) {
    let signedIn = false;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: entry.phone,
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
  cookies().delete(GUEST_COOKIE);
  redirect("/login");
}

// Bypass auth to demo the dashboard without a real Supabase login.
// Only used for testing — the guest is not an authenticated user.
// Always lands on /command-center: the middleware treats guests as fully
// authenticated, so the demo panel opens with no profile/session checks.
export async function setGuestMode() {
  // Guest browse mode is a separate identity — drop any citizen/gov session.
  cookies().delete("role");
  cookies().delete("view_as_public");
  setGuestCookie();
  redirect("/command-center");
}

export async function clearGuestMode() {
  cookies().delete(GUEST_COOKIE);
  redirect("/login");
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
  setGuestCookie();
  cookies().set("role", "public", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7-day browse session
  });
  redirect("/public/dashboard");
}

// Exit guest browse mode: drop the guest/role session and return to the
// two-door landing page so the visitor can choose a real path.
export async function exitGuestMode() {
  cookies().delete("guest_mode");
  cookies().delete("role");
  cookies().delete("view_as_public");
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
  // Clear any stale guest/citizen session so one browser holds one identity.
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().set("role", role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7-day gov session
  });
  redirect(role === "super_admin" ? "/gov/overview" : "/gov/dashboard");
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
  cookies().set("view_as_public", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h preview session
  });
  redirect("/public/dashboard");
}

export async function clearViewAsPublic() {
  cookies().delete("view_as_public");
  redirect("/gov/dashboard");
}

export async function publicOtpLogin(phoneNumber: string) {
  const phone = (phoneNumber ?? "").trim().slice(0, 20);
  // Clear any stale guest/gov session so one browser holds one identity.
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().set("role", "public", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7-day citizen session
  });
  // Remember the number so the citizen onboarding step can prefill it.
  if (phone) {
    cookies().set("citizen_phone", phone, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  redirect("/public/onboarding");
}
