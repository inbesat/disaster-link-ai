"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  FileUp,
  ShieldCheck,
  Upload,
} from "lucide-react";

// ---------------------------------------------------------------------
// app/gov/signup/page.tsx — Phase 1 · Step 4 · Strict Gov Auth Flow.
// Officials request access with their organisation + Employee/Volunteer ID.
// Submission is MOCKED: the form swaps to an "Account Pending Admin
// Approval" screen (no account is created until a real backend exists).
// ---------------------------------------------------------------------

const ORG_OPTIONS = ["NDRF", "SDRF", "District Admin"] as const;

type Submitted = {
  name: string;
  email: string;
  organization: string;
};

export default function GovSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState<string>("NDRF");
  const [password, setPassword] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setIdFile(file);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid official email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!idFile) {
      setError("Attach your Employee / Volunteer ID to verify your role.");
      return;
    }
    setError(null);
    // Mock: nothing is persisted — just show the pending-approval screen.
    setSubmitted({ name, email, organization });
  }

  const inputClass =
    "w-full rounded-[var(--dl-radius-sm)] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[var(--dl-text-muted)] transition focus:border-[var(--dl-blue)] focus:outline-none";
  const labelClass = "eoc-label mb-1.5 block text-[var(--dl-text-on-navy)]";

  // ------------------------------------------------------------------
  // Post-signup screen — account pending admin approval
  // ------------------------------------------------------------------
  if (submitted) {
    return (
      <main className="landing-page relative flex min-h-screen flex-col overflow-hidden bg-[var(--dl-navy)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_-10%,rgba(37,99,235,0.2),transparent),radial-gradient(ellipse_50%_40%_at_0%_110%,rgba(16,185,129,0.08),transparent)]"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
          <div className="rounded-[var(--dl-radius)] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
            <span
              aria-hidden="true"
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--dl-blue)]/20 ring-1 ring-[var(--dl-blue)]/40"
            >
              <CheckCircle2
                aria-hidden="true"
                className="h-10 w-10 text-[var(--dl-blue-light)]"
              />
            </span>
            <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
              Account Pending Admin Approval
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
              Your request for{" "}
              <span className="font-semibold text-white">{submitted.organization}</span>{" "}
              access has been submitted for identity verification. You&apos;ll be notified
              at <span className="font-semibold text-white">{submitted.email}</span> once
              a district admin approves your account.
            </p>

            <div className="mt-6 space-y-2 rounded-[var(--dl-radius-sm)] border border-white/10 bg-[var(--dl-navy-2)]/60 p-4 text-left font-mono text-xs text-[var(--dl-text-on-navy)]">
              <p>
                REQUESTER&nbsp;&nbsp;<span className="text-white">{submitted.name}</span>
              </p>
              <p>
                ORGANISATION&nbsp;&nbsp;
                <span className="text-white">{submitted.organization}</span>
              </p>
              <p>
                STATUS&nbsp;&nbsp;
                <span className="text-[var(--dl-orange-light)]">PENDING REVIEW</span>
              </p>
            </div>

            <Link
              href="/login?mode=gov"
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[var(--dl-blue)] px-4 py-3.5 text-base font-bold text-white transition hover:bg-[var(--dl-blue-light)]"
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Back to Sign In
            </Link>
            <Link
              href="/"
              className="mt-3 block text-center text-sm text-[var(--dl-text-muted)] transition hover:text-white"
            >
              ← Choose another path
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------------------
  // Signup form
  // ------------------------------------------------------------------
  return (
    <main className="landing-page relative flex min-h-screen flex-col overflow-hidden bg-[var(--dl-navy)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_-10%,rgba(37,99,235,0.2),transparent),radial-gradient(ellipse_50%_40%_at_0%_110%,rgba(16,185,129,0.08),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <Link
          href="/"
          className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--dl-text-muted)] transition hover:text-white"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Choose another path
        </Link>

        <div className="rounded-[var(--dl-radius)] border border-white/10 bg-white/5 p-7 backdrop-blur-md md:p-8">
          <p className="eoc-label text-[var(--dl-blue-light)]">GOV ACCESS · REQUEST</p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Request Official Access
          </h1>
          <p className="mt-1.5 text-sm text-[var(--dl-text-on-navy)]">
            Verified responders only. Your ID is reviewed before your account is approved.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="gov-name" className={labelClass}>
                Full Name
              </label>
              <input
                id="gov-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cdr. Asha Verma"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="gov-email" className={labelClass}>
                Official Email
              </label>
              <input
                id="gov-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.gov.in"
                className={inputClass}
              />
            </div>{" "}
            <div>
              <label htmlFor="gov-org" className={labelClass}>
                Organization
              </label>
              <div className="relative">
                <select
                  id="gov-org"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className={`${inputClass} appearance-none pr-10`}
                >
                  {ORG_OPTIONS.map((org) => (
                    <option key={org} value={org} className="bg-[var(--dl-navy-2)]">
                      {org}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="gov-password" className={labelClass}>
                Password
              </label>
              <input
                id="gov-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={inputClass}
              />
            </div>
            {/* Employee / Volunteer ID upload zone */}
            <div>
              <label className={labelClass}>Employee / Volunteer ID</label>
              <label
                htmlFor="gov-id"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] border-2 border-dashed border-[var(--dl-blue)]/40 bg-white/5 px-4 py-8 text-center transition hover:border-[var(--dl-blue)] hover:bg-white/10 focus-within:border-[var(--dl-blue)] focus-within:bg-white/10"
              >
                {idFile ? (
                  <>
                    <FileUp
                      aria-hidden="true"
                      className="h-6 w-6 text-[var(--dl-blue-light)]"
                    />
                    <span className="text-sm font-semibold text-white">
                      {idFile.name}
                    </span>
                    <span className="font-mono text-xs text-[var(--dl-text-muted)]">
                      {(idFile.size / 1024).toFixed(1)} KB · ready to submit
                    </span>
                  </>
                ) : (
                  <>
                    <Upload
                      aria-hidden="true"
                      className="h-6 w-6 text-[var(--dl-blue-light)]"
                    />
                    <span className="text-sm font-medium text-[var(--dl-text-on-navy)]">
                      Tap to attach your ID card or letter
                    </span>
                    <span className="font-mono text-xs text-[var(--dl-text-muted)]">
                      PDF / JPG / PNG · max 5 MB
                    </span>
                  </>
                )}
                {/* sr-only (not hidden) keeps the picker keyboard-focusable */}
                <input
                  id="gov-id"
                  type="file"
                  accept=".pdf,image/*"
                  className="sr-only"
                  onChange={handleFile}
                />
              </label>
            </div>
            {error && (
              <p className="rounded-[var(--dl-radius-sm)] border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-3 py-2 text-sm text-[var(--dl-orange-light)]">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[var(--dl-blue)] px-4 py-3.5 text-base font-bold text-white transition hover:bg-[var(--dl-blue-light)]"
            >
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Submit for Approval
            </button>
            <p className="text-center text-xs text-[var(--dl-text-muted)]">
              Already approved?{" "}
              <Link
                href="/login?mode=gov"
                className="font-semibold text-[var(--dl-blue-light)] transition hover:text-white"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
