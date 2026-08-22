"use client";

// ---------------------------------------------------------------------
// app/(auth)/login/UnifiedAuthCard.tsx — production-styled, tabbed
// authentication card for the SafeSphere login page.
//
// Both forms post straight to Next.js Server Actions in app/actions/auth.ts
// (signUpAction / signInAction / guestLoginAction) — auth runs server-side
// through the Supabase server client. On failure the action redirects back
// to /login?error=<message>, which this card reads via useSearchParams and
// renders in a red banner. On success the action redirects to
// /public/dashboard.
//
// Two modes behind a segmented tab control:
//   · Sign In        — Email + Password → signInAction.
//   · Create Account — Full Name + Email + Password → signUpAction.
// Below the tabs a clear "OR" divider splits the email/password forms
// from the social + guest options:
//   · Sign in with Google   (client-side Supabase OAuth redirect).
//   · Continue as Guest     (view-only session via guestLoginAction).
//
// Mobile-first: full-width touch-friendly controls, max-w-md card.
// ---------------------------------------------------------------------

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck, User } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordAction,
  guestLoginAction,
  signInAction,
  signUpAction,
} from "@/app/actions/auth";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

type AuthTab = "signin" | "signup";

const inputClass =
  "w-full rounded-md border border-border bg-surface-muted py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none";

export default function UnifiedAuthCard() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const resetSent = searchParams.get("reset") === "sent";
  const [tab, setTab] = useState<AuthTab>("signin");

  // Google OAuth is a redirect, not a form action — Supabase returns the
  // URL the browser must follow, so this stays a client-side call.
  async function handleGoogleLogin() {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  }

  return (
    <main className="flex w-full items-center justify-center bg-background px-4">
      <div className="eoc-panel w-full max-w-md p-6 sm:p-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/30">
            <ShieldCheck aria-hidden className="h-5 w-5 text-accent" />
          </span>
          <div className="min-w-0">
            <p className="eoc-label text-accent">EMERGENCY OPERATIONS</p>
            <h1 className="text-xl font-bold tracking-tight">SafeSphere Portal</h1>
          </div>
        </div>

        {/* Server-action errors come back as ?error=<message> */}
        {error && (
          <div className="mt-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {/* Password reset success message */}
        {resetSent && (
          <div className="mt-4">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              If an account exists for that email, a password reset link has been sent.
            </div>
          </div>
        )}

        {/* Segmented tab control */}
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface-muted p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "signin"}
            onClick={() => setTab("signin")}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              tab === "signin"
                ? "bg-accent text-slate-950 shadow"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "signup"}
            onClick={() => setTab("signup")}
            className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              tab === "signup"
                ? "bg-accent text-slate-950 shadow"
                : "text-slate-400 hover:text-foreground"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Active tab form — posts to the matching Server Action */}
        <div role="tabpanel" className="mt-6">
          {tab === "signin" ? (
            <form action={signInAction} className="space-y-4">
              <div>
                <label htmlFor="email" className="eoc-label block mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@organisation.gov.in"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="eoc-label block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="text-right">
                <form action={forgotPasswordAction}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-accent hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </form>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/80"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form action={signUpAction} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="eoc-label block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Aarav Sharma"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signupEmail" className="eoc-label block mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="signupEmail"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@organisation.gov.in"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signupPassword" className="eoc-label block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    id="signupPassword"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/80"
              >
                Create Account
              </button>
            </form>
          )}
        </div>

        {/* Visual divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-widest text-slate-500">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Sign in with Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        {/* Guest access — a form so the server action writes the cookies */}
        <form action={guestLoginAction}>
          <button
            type="submit"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-accent/50 bg-accent/5 px-4 py-3 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
          >
            <User aria-hidden className="h-4 w-4" />
            Continue as Guest
          </button>
        </form>
        <p className="mt-1.5 text-center text-[11px] text-slate-500">
          (Explore the platform with view-only permissions)
        </p>
      </div>
    </main>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-sm text-severity-red-400"
    >
      {message}
    </p>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}