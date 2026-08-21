"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Verify the auth code from the URL
    const code = searchParams.get("code");
    const type = searchParams.get("type");

    if (code && type === "recovery") {
      // Exchange the code for a session
      getSupabase().auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setCodeValid(false);
          setError("Invalid or expired reset link. Please request a new one.");
        } else {
          setCodeValid(true);
        }
      });
    } else if (!code) {
      setCodeValid(false);
      setError("Missing reset code. Please request a new password reset link.");
    }
  }, [searchParams]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number.";
    return null;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const pwdError = validatePassword(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await getSupabase().auth.updateUser({ password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after short delay
      setTimeout(() => {
        router.push("/login?reset=success");
        router.refresh();
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (codeValid === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="eoc-panel w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-severity-red-600/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-severity-red-400" aria-hidden />
          </div>
          <h1 className="text-xl font-bold">Invalid Reset Link</h1>
          <p className="mt-2 text-slate-400">{error}</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/80"
          >
            Request New Link
          </Link>
        </div>
      </main>
    );
  }

  if (codeValid === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="eoc-panel w-full max-w-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-accent border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-400">Verifying reset link...</p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="eoc-panel w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-400" aria-hidden />
          </div>
          <h1 className="text-xl font-bold">Password Updated</h1>
          <p className="mt-2 text-slate-400">Your password has been successfully changed. Redirecting to login...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="eoc-panel w-full max-w-md p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 ring-1 ring-accent/30">
            <Lock className="h-5 w-5 text-accent" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="eoc-label text-accent">EMERGENCY OPERATIONS</p>
            <h1 className="text-xl font-bold tracking-tight">Set New Password</h1>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-400">Enter your new password below. It must be different from your previous password.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="eoc-label block mb-1.5">
              New Password
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-md border border-border bg-surface-muted py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="eoc-label block mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full rounded-md border border-border bg-surface-muted py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-sm text-severity-red-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}