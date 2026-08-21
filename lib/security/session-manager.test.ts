import { describe, expect, it } from "vitest";
import {
  getActiveSessions,
  isSessionExpired,
  registerSession,
  revokeAllSessions,
  revokeSession,
} from "./session-manager";
import { isAccountLocked, recordFailedLogin, resetFailedLogins } from "./account-lockout";

describe("session-manager", () => {
  const userId = "test_user_123";

  it("registers a session and limits concurrent sessions to 3", () => {
    registerSession(userId, "district_admin", "192.168.1.1", "Chrome", "Patna");
    registerSession(userId, "district_admin", "192.168.1.2", "Firefox", "Patna");
    registerSession(userId, "district_admin", "192.168.1.3", "Safari", "Patna");
    registerSession(userId, "district_admin", "192.168.1.4", "Edge", "Patna");

    const active = getActiveSessions(userId);
    expect(active.length).toBe(3);
    expect(active[0].ip).toBe("192.168.1.4");
  });

  it("revokes a specific session", () => {
    const s1 = registerSession(userId, "public", "10.0.0.1", "Browser");
    const activeBefore = getActiveSessions(userId);
    expect(activeBefore.some((s) => s.id === s1.id)).toBe(true);

    revokeSession(userId, s1.id);
    const activeAfter = getActiveSessions(userId);
    expect(activeAfter.some((s) => s.id === s1.id)).toBe(false);
  });

  it("revokes all sessions except current", () => {
    const current = registerSession(userId, "public", "10.0.0.1", "Browser");
    registerSession(userId, "public", "10.0.0.2", "Mobile");

    revokeAllSessions(userId, current.id);
    const active = getActiveSessions(userId);
    expect(active.length).toBe(1);
    expect(active[0].id).toBe(current.id);
  });

  it("calculates session expiration correctly", () => {
    const activeSession = {
      id: "s1",
      userId,
      role: "public",
      ip: "127.0.0.1",
      userAgent: "Agent",
      location: "Patna",
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    expect(isSessionExpired(activeSession)).toBe(false);

    const expiredGovSession = {
      ...activeSession,
      role: "district_admin",
      lastActiveAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago (>4h)
    };

    expect(isSessionExpired(expiredGovSession)).toBe(true);
  });
});

describe("account-lockout", () => {
  const account = "user@drip.gov.in";

  it("locks out account after 5 failed login attempts", () => {
    resetFailedLogins(account);
    expect(isAccountLocked(account).locked).toBe(false);

    for (let i = 1; i <= 4; i++) {
      const res = recordFailedLogin(account);
      expect(res.locked).toBe(false);
    }

    const FifthAttempt = recordFailedLogin(account);
    expect(FifthAttempt.locked).toBe(true);
    expect(isAccountLocked(account).locked).toBe(true);
  });

  it("resets failed logins on successful login", () => {
    resetFailedLogins(account);
    recordFailedLogin(account);
    recordFailedLogin(account);

    resetFailedLogins(account);
    expect(isAccountLocked(account).locked).toBe(false);
  });
});
