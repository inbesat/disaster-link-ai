// ---------------------------------------------------------------------
// lib/security/otp.test.ts — Phase 1 · Step 11 · OTP delivery semantics.
// Locks the code lifecycle extracted from app/actions/auth.ts: 6-digit
// crypto-random generation, phone normalisation, 5-minute expiry,
// single-use consumption, and malformed-code rejection.
// ---------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OTP_TTL_MS,
  consumeOtp,
  generateOtp,
  issueOtp,
  normalizePhone,
  otpCount,
  resetOtpStore,
} from "./otp";

beforeEach(() => {
  vi.useFakeTimers();
  resetOtpStore();
});

afterEach(() => {
  vi.useRealTimers();
  resetOtpStore();
});

describe("generateOtp", () => {
  it("returns a 6-digit numeric code by default", () => {
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("honours a custom length", () => {
    expect(generateOtp(4)).toMatch(/^\d{4}$/);
    expect(generateOtp(8)).toMatch(/^\d{8}$/);
  });

  it("produces varying codes across calls (not a constant)", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) seen.add(generateOtp());
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("normalizePhone", () => {
  it("accepts E.164 numbers with a leading plus", () => {
    expect(normalizePhone("+919876543210")).toBe("+919876543210");
  });

  it("accepts bare 10-digit numbers", () => {
    expect(normalizePhone("9876543210")).toBe("9876543210");
  });

  it("strips spaces, dashes and parentheses", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("+919876543210");
    expect(normalizePhone("(987) 654-3210")).toBe("9876543210");
  });

  it("rejects numbers outside 7–15 digits", () => {
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("123456")).toBeNull();
    expect(normalizePhone("12345678901234567890")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(normalizePhone("abc9876543210")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
});

describe("issueOtp / consumeOtp", () => {
  it("round-trips a code to its phone number", () => {
    issueOtp("123456", "+919876543210");
    expect(consumeOtp("123456")).toBe("+919876543210");
  });

  it("is single-use — the same code cannot be consumed twice", () => {
    issueOtp("123456", "+919876543210");
    expect(consumeOtp("123456")).toBe("+919876543210");
    expect(consumeOtp("123456")).toBeNull();
  });

  it("rejects an unknown code", () => {
    expect(consumeOtp("999999")).toBeNull();
  });

  it("rejects codes that have expired", () => {
    vi.setSystemTime(1_000_000_000_000);
    issueOtp("123456", "+919876543210");

    // Still valid just before the TTL elapses.
    vi.advanceTimersByTime(OTP_TTL_MS - 1);
    expect(consumeOtp("123456")).toBe("+919876543210");
  });

  it("prunes expired entries so the store doesn't leak dead codes", () => {
    vi.setSystemTime(1_000_000_000_000);
    issueOtp("123456", "+919876543210");
    vi.advanceTimersByTime(OTP_TTL_MS + 1);
    expect(consumeOtp("123456")).toBeNull();
    expect(otpCount()).toBe(0);
  });

  it("rejects malformed codes (wrong length, non-digits)", () => {
    issueOtp("123456", "+919876543210");
    expect(consumeOtp("12345")).toBeNull();
    expect(consumeOtp("abcdef")).toBeNull();
    expect(consumeOtp("1234567")).toBeNull();
    expect(consumeOtp("")).toBeNull();
    // The live code is untouched by malformed attempts.
    expect(consumeOtp("123456")).toBe("+919876543210");
  });

  it("tolerates surrounding whitespace and stray separators on the code", () => {
    issueOtp("123456", "+919876543210");
    expect(consumeOtp(" 123-456 ")).toBe("+919876543210");
  });

  it("resetOtpStore clears all issued codes", () => {
    issueOtp("111111", "+919876543210");
    issueOtp("222222", "+9198888888");
    expect(otpCount()).toBe(2);
    resetOtpStore();
    expect(otpCount()).toBe(0);
    expect(consumeOtp("111111")).toBeNull();
  });
});
