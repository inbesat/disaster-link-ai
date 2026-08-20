"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, KeyRound, Phone } from "lucide-react";
import { publicOtpLogin } from "@/app/actions/auth";

// ---------------------------------------------------------------------
// app/public/login/page.tsx — Phase 1 · Step 3 · Frictionless Public Auth.
// Scared citizens shouldn't remember passwords: just a phone number, then a
// 6-digit code. The demo accepts ANY 6-digit code (no real SMS is sent);
// on verify, publicOtpLogin() writes the role=public session cookie and
// redirects to /public/onboarding.
// ---------------------------------------------------------------------

type Step = "phone" | "otp";

export default function PublicLoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first OTP box the moment the code step appears.
  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  function handlePhoneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      setError("Enter a valid phone number.");
      return;
    }
    setError(null);
    // Demo: no SMS is sent — any 6-digit code passes on the next step.
    setStep("otp");
  }

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const chars = prev.split("");
      chars[index] = digit;
      return chars.join("");
    });
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6 - index);
    if (!pasted) return;
    e.preventDefault();
    setOtp(
      (prev) =>
        (prev.slice(0, index) + pasted + prev.slice(index + pasted.length)).slice(0, 6),
    );
    otpRefs.current[Math.min(index + pasted.length, 5)]?.focus();
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (otp.replace(/\D/g, "").length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Sets role=public cookie and redirects to /public/onboarding. On the
      // success path the page navigates away, so setLoading(false) below only
      // runs on an unexpected server failure (defensive — the action itself
      // never rejects on success).
      await publicOtpLogin(phone);
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  const inputClass =
    "w-full rounded-[var(--dl-radius-sm)] border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-[var(--dl-text-muted)] transition focus:border-[var(--dl-orange)] focus:outline-none";

  return (
    <main className="landing-page relative flex min-h-screen flex-col overflow-hidden bg-[var(--dl-navy)]">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_-10%,rgba(249,115,22,0.22),transparent),radial-gradient(ellipse_50%_40%_at_0%_110%,rgba(37,99,235,0.18),transparent)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        {/* Back to the two doors */}
        <Link
          href="/"
          className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--dl-text-muted)] transition hover:text-white"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Choose another path
        </Link>

        <div className="rounded-[var(--dl-radius)] border border-white/10 bg-white/5 p-7 backdrop-blur-md md:p-8">
          <p className="eoc-label mb-4 text-[var(--dl-orange-light)]">CITIZEN ACCESS</p>

          {step === "phone" ? (
            <>
              <span
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--dl-orange)]/20 text-4xl ring-1 ring-[var(--dl-orange)]/40"
              >
                🏠
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
                Welcome, neighbor
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
                No passwords here. Enter your phone number and we&apos;ll send a
                one-time code — it takes seconds.
              </p>

              <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="phone" className="eoc-label mb-1.5 block text-[var(--dl-text-on-navy)]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dl-text-muted)]"
                    />
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`${inputClass} pl-11`}
                    />
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
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] bg-[var(--dl-orange)] px-4 py-3.5 text-base font-bold text-white transition hover:bg-[#EA5B0C] disabled:opacity-60"
                >
                  Send OTP
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
                <p className="text-center text-xs text-[var(--dl-text-muted)]">
                  Free of charge. Your number is only used for emergency alerts.
                </p>
              </form>
            </>
          ) : (
            <>
              <span
                aria-hidden="true"
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--dl-blue)]/20 text-4xl ring-1 ring-[var(--dl-blue)]/40"
              >
                <KeyRound aria-hidden="true" className="h-8 w-8 text-[var(--dl-blue-light)]" />
              </span>
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">
                Enter the 6-digit code
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
                Sent to <span className="font-semibold text-white">{phone}</span>.{" "}
                <span className="text-[var(--dl-orange-light)]">Demo:</span> any 6
                digits work — no SMS is sent.
              </p>

              <form onSubmit={handleVerify} className="mt-6 space-y-4">
                <div
                  role="group"
                  aria-label="6-digit verification code"
                  className="flex justify-between gap-2"
                >
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      aria-label={`Digit ${index + 1}`}
                      value={otp[index] ?? ""}
                      onChange={(e) => handleDigit(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={(e) => handlePaste(index, e)}
                      className="h-14 w-11 rounded-[var(--dl-radius-sm)] border border-white/15 bg-white/5 text-center text-xl font-bold text-white transition focus:border-[var(--dl-orange)] focus:outline-none sm:w-12"
                    />
                  ))}
                </div>

                {error && (
                  <p className="rounded-[var(--dl-radius-sm)] border border-[var(--dl-orange)]/40 bg-[var(--dl-orange)]/10 px-3 py-2 text-sm text-[var(--dl-orange-light)]">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[var(--dl-radius-sm)] bg-[var(--dl-orange)] px-4 py-3.5 text-base font-bold text-white transition hover:bg-[#EA5B0C] disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Verify & Continue"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError(null);
                  }}
                  className="w-full text-center text-sm text-[var(--dl-text-muted)] transition hover:text-white"
                >
                  ← Use a different number
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[var(--dl-text-muted)]">
          Emergency? Call the District Control Room{" "}
          <a href="tel:1070" className="font-semibold text-[var(--dl-orange-light)] hover:underline">
            1070
          </a>
        </p>
      </div>
    </main>
  );
}
