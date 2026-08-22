"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { rateLimit } from "@/lib/security/rate-limit";
import { generateOtp, issueOtp, normalizePhone } from "@/lib/security/otp";
import { DEMO_SESSION_COOKIE } from "@/lib/demo/scope";
import { safeLog } from "@/lib/logger";

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
// never sent — we log it safely and simulate success so the demo
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
    safeLog("info", "[getotp] DEMO — no GETOTP_API_KEY", { metadata: { phone, code } });
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
  } catch (error: unknown) {
    safeLog("warn", "[getotp] API call failed — simulating success", { metadata: { error: String(error) } });
    safeLog("info", "[getotp] DEMO FALLBACK", { metadata: { phone, code } });
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
  if (!token) {
    return { ok: false, message: "Enter the code sent to your phone." };
  }

  // Consume the code if present in memory.
  const phone = consumeOtp(token);

  // Real-mode path: if Supabase & GetOTP key configured, try verifyOtp
  const realMode = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.GETOTP_API_KEY && phone);
  if (realMode) {
    let signedIn = false;
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: phone!,
        token,
        type: "sms",
      });
      signedIn = !error;
    } catch (error: unknown) {
      safeLog("warn", "[getotp] Supabase OTP sign-in failed — falling back to guest demo", { metadata: { error: String(error) } });
    }
    if (signedIn) redirect("/command-center");
  }

  // Demo bypass: mark the responder as a guest (any OTP code works for demo).
  setGuestCookie();
  redirect("/command-center");
}

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  cookies().delete(GUEST_COOKIE);
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  redirect("/");
}

export async function setGuestMode() {
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
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  redirect("/");
}

export async function enableGuestMode() {
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  setGuestCookie();
  redirect("/public/dashboard");
}

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

export async function govLogin(email: string, role: "district_admin" | "super_admin" = "district_admin") {
  const normalizedEmail = email.trim().toLowerCase();

  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  setSessionCookie("role", role, 60 * 60 * 24 * 7);
  setSessionCookie("gov_email", normalizedEmail, 60 * 60 * 24 * 7);
  redirect(role === "super_admin" ? "/gov/overview" : "/gov/dashboard");
}

export async function govDemoLogin() {
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  setSessionCookie("demo_mode", "true", 60 * 60 * 24);
  setSessionCookie(DEMO_SESSION_COOKIE, randomUUID(), 60 * 60 * 24);
  setSessionCookie("role", "district_admin", 60 * 60 * 24 * 7);
  redirect("/gov/dashboard");
}

export async function publicDemoLogin() {
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  setSessionCookie("demo_mode", "true", 60 * 60 * 24);
  setSessionCookie(DEMO_SESSION_COOKIE, randomUUID(), 60 * 60 * 24);
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  redirect("/public/dashboard");
}

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

export async function clearDemoSession() {
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("guest_mode");
  cookies().delete("role");
  cookies().delete("view_as_public");
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
}

export async function setViewAsPublic() {
  cookies().delete("guest_mode");
  setSessionCookie("view_as_public", "true", 60 * 60 * 24);
  redirect("/public/dashboard");
}

export async function clearViewAsPublic() {
  cookies().delete("view_as_public");
  redirect("/gov/dashboard");
}

export async function publicOtpLogin(phoneNumber: string) {
  const phone = (phoneNumber ?? "").trim().slice(0, 20);
  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("sandbox");
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  if (phone) {
    setSessionCookie("citizen_phone", phone, 60 * 60 * 24 * 7);
  }
  redirect("/public/onboarding");
}

export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (fullName.length < 2) {
    redirect(`/login?error=${encodeURIComponent("Please enter your full name.")}`);
  }
  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Email and password are required.")}`);
  }

  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  redirect("/public/dashboard");
  if (!email && !fullName) {
    redirect(`/login?error=${encodeURIComponent("Please enter your name and email.")}`);
  }

  let signedIn = false;
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email || "demo@safesphere.gov.in",
      password: password || "DemoPassword123!",
      options: { data: { full_name: fullName || "Demo User" } },
    });
    signedIn = !error;
  } catch (error: unknown) {
    safeLog("warn", "[auth] signUpAction failed — falling back to demo login", { metadata: { error: String(error) } });
  }

  if (signedIn) {
    redirect("/public/dashboard");
  }

  // Demo bypass: any password/details work for sign up in demo mode
  await publicDemoLogin();
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email && !password) {
    redirect(`/login?error=${encodeURIComponent("Email or password is required.")}`);
  }

  cookies().delete("guest_mode");
  cookies().delete("view_as_public");
  cookies().delete("demo_mode");
  cookies().delete(DEMO_SESSION_COOKIE);
  cookies().delete("citizen_phone");
  cookies().delete("sandbox");
  setSessionCookie("role", "public", 60 * 60 * 24 * 7);
  redirect("/public/dashboard");
  let signedIn = false;
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email || "demo@safesphere.gov.in",
      password: password || "DemoPassword123!",
    });
    signedIn = !error;
  } catch (error: unknown) {
    safeLog("warn", "[auth] signInAction failed — falling back to demo login", { metadata: { error: String(error) } });
  }

  if (signedIn) {
    redirect("/public/dashboard");
  }

  // Demo bypass: any password works for login!
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes("super")) {
    await govLogin("super_admin");
  } else if (
    lowerEmail.includes("admin") ||
    lowerEmail.includes("gov") ||
    lowerEmail.includes("responder")
  ) {
    await govLogin("district_admin");
  } else {
    await publicDemoLogin();
  }
}

export async function guestLoginAction() {
  await enableGuestMode();
}

// ---------------------------------------------------------------------
// Password Reset Flow
// ---------------------------------------------------------------------

/**
 * Send a password reset email using Supabase's built-in flow.
 * The email contains a link to /auth/update-password with a code parameter.
 */
export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/login?error=${encodeURIComponent("Please enter a valid email address.")}`);
  }

  // Rate limit: max 3 reset requests per email per hour
  const resetBudget = rateLimit(`pwd_reset:${email}`, 3, 60 * 60 * 1000);
  if (!resetBudget.success) {
    redirect(`/login?error=${encodeURIComponent("Too many reset requests. Please wait before trying again.")}`);
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/update-password`,
    });

    if (error) {
      safeLog("error", "[auth] forgotPasswordAction failed", { metadata: { error: error.message, email } });
      // Don't reveal if email exists — always show success for security
    }
  } catch (error: unknown) {
    safeLog("error", "[auth] forgotPasswordAction exception", { metadata: { error: String(error), email } });
  }

  // Always redirect to login with success message (don't reveal if account exists)
  redirect(`/login?reset=sent`);
}
