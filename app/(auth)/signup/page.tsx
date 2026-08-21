"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DemoConversionWelcome from "@/components/demo/DemoConversionWelcome";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be at least 8 characters long and contain at least one uppercase letter and one number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await getSupabase().auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/profile-setup");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="eoc-panel w-full max-w-md p-8">
        <p className="eoc-label mb-1 text-accent">EMERGENCY OPERATIONS</p>
        <h1 className="text-2xl font-bold">Request Access</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create an account to join the response network.
        </p>

        {/* Phase 2 · Step 10 — demo→real conversion: welcome modal +
            prefill context when arriving from the ConversionBanner
            (?converted=demo). Suspense-wrapped for useSearchParams. */}
        <Suspense fallback={null}>
          <div className="mt-4">
            <DemoConversionWelcome />
          </div>
        </Suspense>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="eoc-label block mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organisation.gov.in"
              className="w-full rounded-md border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="eoc-label block mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full rounded-md border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="eoc-label block mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full rounded-md border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-sm text-severity-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
