// ---------------------------------------------------------------------
// lib/security/account-lockout.ts — Account Lockout Security
//
// Tracks failed login attempts per key (email or IP). Locks out accounts
// after 5 consecutive failed attempts for a 15-minute window.
// ---------------------------------------------------------------------

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LockoutRecord {
  failedAttempts: number;
  lockedUntil: number | null;
}

const lockoutStore = new Map<string, LockoutRecord>();

/**
 * Check whether an account or IP is currently locked out.
 */
export function isAccountLocked(identifier: string): { locked: boolean; remainingMs: number } {
  const record = lockoutStore.get(identifier);
  if (!record || !record.lockedUntil) {
    return { locked: false, remainingMs: 0 };
  }

  const now = Date.now();
  if (now >= record.lockedUntil) {
    // Lockout expired — clear lockout status
    lockoutStore.delete(identifier);
    return { locked: false, remainingMs: 0 };
  }

  return { locked: true, remainingMs: record.lockedUntil - now };
}

/**
 * Record a failed login attempt. Returns true if the attempt caused a lockout.
 */
export function recordFailedLogin(identifier: string): { locked: boolean; attempts: number } {
  const now = Date.now();
  const record = lockoutStore.get(identifier) ?? { failedAttempts: 0, lockedUntil: null };

  // If already locked, remain locked
  if (record.lockedUntil && now < record.lockedUntil) {
    return { locked: true, attempts: record.failedAttempts };
  }

  record.failedAttempts += 1;

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    lockoutStore.set(identifier, record);
    return { locked: true, attempts: record.failedAttempts };
  }

  lockoutStore.set(identifier, record);
  return { locked: false, attempts: record.failedAttempts };
}

/**
 * Reset failed attempts on a successful login.
 */
export function resetFailedLogins(identifier: string): void {
  lockoutStore.delete(identifier);
}
