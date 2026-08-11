// ---------------------------------------------------------------------
// lib/security/otp.ts — Phase 1 · Step 3 · OTP issuance & verification.
//
// Extracted from app/actions/auth.ts so the delivery semantics (6-digit
// crypto-random codes, phone normalisation, 5-minute expiry, single-use
// consumption) are unit-testable without a Next.js server runtime.
//
// The caller (sendOTP/verifyOTP in the server actions) is still
// responsible for rate limiting and for the actual SMS dispatch — this
// module only owns the code lifecycle.
// ---------------------------------------------------------------------

import { randomInt } from "node:crypto";

/** Codes expire after 5 minutes (matches the actions' OTP_TTL_MS). */
export const OTP_TTL_MS = 5 * 60 * 1000;

type OtpEntry = { phone: string; expiresAt: number };

// code -> entry (in-memory; resets on server restart, fine for a demo —
// a production build would back this with a KV store).
const otpStore = new Map<string, OtpEntry>();

/** Cryptographically-random digits — never Math.random for OTP material. */
export function generateOtp(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) code += randomInt(0, 10);
  return code;
}

/** Strip spaces/dashes/parens and validate an E.164-ish phone number. */
export function normalizePhone(raw: string): string | null {
  const phone = (raw ?? "").replace(/[\s\-()]/g, "");
  return /^\+?\d{7,15}$/.test(phone) ? phone : null;
}

/** Issue a code for a phone. Callers must rate-limit BEFORE issuing. */
export function issueOtp(code: string, phone: string): void {
  otpStore.set(code, { phone, expiresAt: Date.now() + OTP_TTL_MS });
}

/**
 * Verify + consume a code in one step (single-use).
 *
 * Returns the phone number on success — the entry is removed so a code
 * can never be redeemed twice. Returns null for unknown, malformed or
 * expired codes; expired entries are pruned as a side effect so the
 * store doesn't leak dead codes.
 */
export function consumeOtp(code: string): string | null {
  const token = (code ?? "").trim().replace(/\D/g, "");
  if (!/^\d{6}$/.test(token)) return null;
  const entry = otpStore.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    if (entry) otpStore.delete(token);
    return null;
  }
  otpStore.delete(token);
  return entry.phone;
}

/** Test/teardown helper — clears all issued codes. */
export function resetOtpStore(): void {
  otpStore.clear();
}

/** Number of live codes (test introspection). */
export function otpCount(): number {
  return otpStore.size;
}
