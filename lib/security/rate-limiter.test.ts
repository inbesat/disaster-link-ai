// Step 5 — role-based rate limiter tests: tier mapping, per-role limits,
// exhaustion, role/IP independence, and the sliding-window reopen.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ROLE_RATE_LIMITS,
  rateLimitTierForRole,
  rateLimitByRole,
  clientIpFromRequest,
} from "./rate-limiter";
import { resetRateLimits } from "./rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
  resetRateLimits();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimitTierForRole", () => {
  it("maps admin roles to the 300 req/min tier", () => {
    expect(rateLimitTierForRole("super_admin")).toBe("admin");
    expect(rateLimitTierForRole("district_admin")).toBe("admin");
    expect(rateLimitTierForRole("admin")).toBe("admin");
  });

  it("maps field_responder to the 100 req/min tier", () => {
    expect(rateLimitTierForRole("field_responder")).toBe("field_responder");
  });

  it("errs to the strictest (public) tier for unknown/guest roles", () => {
    expect(rateLimitTierForRole("public")).toBe("public");
    expect(rateLimitTierForRole("viewer")).toBe("public");
    expect(rateLimitTierForRole("")).toBe("public");
    expect(rateLimitTierForRole(null)).toBe("public");
    expect(rateLimitTierForRole(undefined)).toBe("public");
  });
});

describe("rateLimitByRole", () => {
  it("allows 30 public req/min and reports remaining slots", () => {
    for (let i = 0; i < 30; i++) {
      const result = rateLimitByRole("public", "1.2.3.4");
      expect(result.success).toBe(true);
      expect(result.limit).toBe(ROLE_RATE_LIMITS.public);
    }
    const blocked = rateLimitByRole("public", "1.2.3.4");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("allows 100 field_responder req/min", () => {
    for (let i = 0; i < 100; i++) {
      rateLimitByRole("field_responder", "5.6.7.8");
    }
    const blocked = rateLimitByRole("field_responder", "5.6.7.8");
    expect(blocked.success).toBe(false);
    expect(blocked.limit).toBe(ROLE_RATE_LIMITS.field_responder);
  });

  it("allows 300 admin req/min (super_admin and district_admin alike)", () => {
    for (let i = 0; i < 300; i++) {
      rateLimitByRole("district_admin", "9.9.9.9");
    }
    const blocked = rateLimitByRole("district_admin", "9.9.9.9");
    expect(blocked.success).toBe(false);
    expect(blocked.limit).toBe(ROLE_RATE_LIMITS.admin);
  });

  it("keeps role budgets independent (a public flood never eats the admin budget)", () => {
    for (let i = 0; i < 30; i++) rateLimitByRole("public", "1.2.3.4");
    expect(rateLimitByRole("public", "1.2.3.4").success).toBe(false);
    expect(rateLimitByRole("admin", "1.2.3.4").success).toBe(true);
    expect(rateLimitByRole("field_responder", "1.2.3.4").success).toBe(true);
  });

  it("keeps IPs independent", () => {
    for (let i = 0; i < 30; i++) rateLimitByRole("public", "1.1.1.1");
    expect(rateLimitByRole("public", "2.2.2.2").success).toBe(true);
  });

  it("reopens the window after a minute elapses", () => {
    for (let i = 0; i < 30; i++) rateLimitByRole("public", "3.3.3.3");
    expect(rateLimitByRole("public", "3.3.3.3").success).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(rateLimitByRole("public", "3.3.3.3").success).toBe(true);
  });
});

describe("clientIpFromRequest", () => {
  it("takes the first x-forwarded-for entry", () => {
    const request = new Request("http://localhost/api/public/shelters", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIpFromRequest(request)).toBe("203.0.113.7");
  });

  it("falls back to 'anonymous' when the header is absent", () => {
    expect(clientIpFromRequest(new Request("http://localhost/"))).toBe("anonymous");
  });
});
