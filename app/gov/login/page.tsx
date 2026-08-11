"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { govLogin } from "@/app/actions/auth";

// ---------------------------------------------------------------------
// app/gov/login/page.tsx — Phase 1 · Step 4 · Strict Gov Auth Flow.
// Dark, data-dense, authoritative. Email + password only. The DEMO accepts
// any credentials, writes a `role=district_admin` session cookie and
// redirects to /gov/dashboard.
// ---------------------------------------------------------------------

const STATUS_READOUTS = [
  { label: "ACTIVE INCIDENTS", value: "12", accent: true },
  { label: "DISTRICTS COVERED", value: "38 / 38", accent: false },
  { label: "SESSION POLICY", value: "MFA · 15-MIN IDLE LOCK", accent: false },
  { label: "LAST SYNC", value: "09:41 IST", accent: false },
];

const REQUIREMENTS = [
  "Role-assigned credentials only",
  "Two-factor enforcement for Commanders",
  "Every login written to the audit log",
];

/** Demo role options — the selector on the form (Phase 7 · Step 10). */
const DEMO_ROLES = [
  { key: "district_admin" as const, label: "District Admin", description: "District Command Center" },
  { key: "super_admin" as const, label: "Super Admin", description: "State HQ Multi-District Overview" },
];

export default function GovLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"district_admin" | "super_admin">("district_admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid official email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Demo auth: any credentials pass; writes the selected role cookie
      // (district_admin → /gov/dashboard, super_admin → /gov/overview).
      await govLogin(role);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Sign-in failed. Try again.");
    }
  }

  const inputClass =
    "w-full rounded-[var(--dl-radius-sm)] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--dl-text-muted)] transition focus:border-[var(--dl-blue)] focus:outline-none";

  return (
    <main className="landing-page relative flex min-h-screen flex-col overflow-hidden bg-[var(--dl-navy)]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_-10%,rgba(37,99,235,0.22),transparent),radial-gradient(ellipse_50%_40%_at_0%_110%,rgba(16,185,129,0.08),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--dl-text-muted)] transition hover:text-white"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Choose another path
        </Link>

        <div className="grid overflow-hidden rounded-[var(--dl-radius)] border border-white/10 bg-white/5 backdrop-blur-md lg:grid-cols-[1fr_1.1fr]">
          {/* ------------------------------------------------------------------
              LEFT — operational readout (data-dense, desktop only)
              ------------------------------------------------------------------ */}
          <aside className="hidden flex-col justify-between border-b border-white/10 bg-[var(--dl-navy-2)]/60 p-8 lg:flex lg:border-b-0 lg:border-r">
            <div>
              <p className="eoc-label text-[var(--dl-blue-light)]">
                GOV ACCESS · SECURE CHANNEL
              </p>
              <div className="mt-6 space-y-4">
                {STATUS_READOUTS.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="eoc-label text-[var(--dl-text-muted)]">{item.label}</p>
                    <p
                      className={`mt-1 font-mono text-xl font-bold ${
                        item.accent ? "text-[var(--dl-orange-light)]" : "text-white"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="eoc-label mb-3 text-[var(--dl-text-muted)]">
                SESSION REQUIREMENTS
              </p>
              <ul className="space-y-2">
                {REQUIREMENTS.map((req) => (
                  <li
                    key={req}
                    className="flex items-start gap-2 text-xs text-[var(--dl-text-on-navy)]"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 text-[var(--dl-blue-light)]"
                    >
                      ▸
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-white/10 pt-4 font-mono text-[0.6875rem] leading-relaxed text-[var(--dl-text-muted)]">
                Unauthorized access is tracked &amp; logged.
                <br />
                System: DRIP-GOV v2.4 · Encrypted channel ✓
              </p>
            </div>
          </aside>

          {/* ------------------------------------------------------------------
              RIGHT — sign-in form (mobile-first: rendered first in DOM)
              ------------------------------------------------------------------ */}
          <section className="p-7 md:p-9">
            <p className="eoc-label text-[var(--dl-blue-light)]">STRICT ACCESS</p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
              Responder / Official Sign In
            </h1>
            <p className="mt-1.5 text-sm text-[var(--dl-text-on-navy)]">
              Role-assigned credentials required. Contact your district admin for access.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label
                  htmlFor="gov-email"
                  className="eoc-label mb-1.5 block text-[var(--dl-text-on-navy)]"
                >
                  Official Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                  />
                  <input
                    id="gov-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@organisation.gov.in"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <p className="eoc-label mb-1.5 block text-[var(--dl-text-on-navy)]">
                  Demo Role
                </p>
                <div
                  role="radiogroup"
                  aria-label="Demo role"
                  className="grid grid-cols-2 gap-2"
                >
                  {DEMO_ROLES.map((option) => {
                    const active = role === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setRole(option.key)}
                        className={`rounded-[var(--dl-radius-sm)] border px-3 py-2.5 text-left transition ${
                          active
                            ? "border-[var(--dl-blue-light)]/60 bg-[var(--dl-blue)]/20"
                            : "border-white/15 bg-white/5 hover:border-white/25"
                        }`}
                      >
                        <span
                          className={`block text-sm font-semibold ${active ? "text-[var(--dl-blue-light)]" : "text-white"}`}
                        >
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] text-[var(--dl-text-muted)]">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="gov-password"
                  className="eoc-label mb-1.5 block text-[var(--dl-text-on-navy)]">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                  />
                  <input
                    id="gov-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pl-10 pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dl-text-muted)] transition hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-[var(--dl-radius-sm)] border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-3 py-2 text-sm text-[var(--dl-orange-light)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[var(--dl-blue)] px-4 py-3.5 text-base font-bold text-white transition hover:bg-[var(--dl-blue-light)] disabled:opacity-60"
              >
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                {loading ? "Authenticating…" : "Sign In"}
              </button>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--dl-text-muted)]">
                  Demo: any credentials work
                </span>
                <Link
                  href="/gov/signup"
                  className="font-semibold text-[var(--dl-blue-light)] transition hover:text-white"
                >
                  Request access →
                </Link>
              </div>
            </form>
          </section>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--dl-text-muted)]">
          Emergency? Call the District Control Room{" "}
          <a
            href="tel:1070"
            className="font-semibold text-[var(--dl-orange-light)] hover:underline"
          >
            1070
          </a>
        </p>
      </div>
    </main>
  );
}
