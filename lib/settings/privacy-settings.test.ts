import { afterEach, describe, expect, it } from "vitest";
import {
  auditEventsToCsv,
  createApiKey,
  DEFAULT_PRIVACY_SETTINGS,
  filterAuditEvents,
  formatAuditTimestamp,
  mergePrivacySettings,
  readStoredPrivacySettings,
  relativeAuditTime,
  revokeApiKey,
  writeStoredPrivacySettings,
  DEMO_AUDIT_EVENTS,
} from "./privacy-settings";

// ---------------------------------------------------------------------
// lib/settings/privacy-settings.test.ts — Privacy & Security (Phase 6 · Step 10).
//
// Verifies the merge/sanitize layer protecting the privacy snapshot
// (API keys with bs_live_ prefixes, retention, deactivation, login
// security), the audit-event filter helpers, and the localStorage
// round-trip used by the Phase 6 cards.
// ---------------------------------------------------------------------

describe("mergePrivacySettings", () => {
  it("returns shipped defaults for null / junk input", () => {
    expect(mergePrivacySettings(null).apiKeys).toHaveLength(4);
    expect(mergePrivacySettings("corrupt").retention).toEqual(
      DEFAULT_PRIVACY_SETTINGS.retention,
    );
    expect(mergePrivacySettings(42).deactivation).toEqual(
      DEFAULT_PRIVACY_SETTINGS.deactivation,
    );
  });

  it("populates sane defaults so the UI is never blank on first load", () => {
    const fresh = mergePrivacySettings(null);
    expect(fresh.apiKeys[0].label).toBe("Drone-Telemetry-Feed");
    expect(fresh.apiKeys[0].scope).toBe("read_write");
    expect(fresh.apiKeys[0].createdAt).toBe("Oct 12");
    expect(fresh.apiKeys[0].ip).toBe("192.168.1.1");
    expect(fresh.retention.chatHistoryDays).toBe(30);
    expect(fresh.retention.predictionsDays).toBe(90);
    expect(fresh.retention.attendanceMonths).toBe(12);
    // GPS location archive defaults to the 24-hour window.
    expect(fresh.retention.gpsLocationHours).toBe(24);
    expect(fresh.deactivation.mode).toBeNull();
    expect(fresh.deactivation.effectiveAt).toBeNull();
  });

  it("sanitizes API key records", () => {
    const merged = mergePrivacySettings({
      apiKeys: [
        { id: "k1", label: "Field App", scope: "read_write", lastUsed: "5m ago", ip: "1.2.3.4", createdAt: "2026-01-01", revoked: false, prefix: "bs_live_aaaa" },
        { id: "k2", label: "Junk Key", scope: "mega-admin", lastUsed: 42, ip: null, createdAt: "x", revoked: "yes", prefix: "zzz" },
      ],
    });
    expect(merged.apiKeys[0].scope).toBe("read_write");
    expect(merged.apiKeys[0].revoked).toBe(false);
    // invalid scope → read; invalid revoked → false
    expect(merged.apiKeys[1].scope).toBe("read");
    expect(merged.apiKeys[1].revoked).toBe(false);
    // non-string lastUsed → null
    expect(merged.apiKeys[1].lastUsed).toBeNull();
  });

  it("drops malformed API key records entirely", () => {
    const merged = mergePrivacySettings({
      apiKeys: [{ scope: "read" }, "nope", null],
    });
    expect(merged.apiKeys).toHaveLength(0);
  });

  it("sanitizes retention numbers to non-negative integers", () => {
    const merged = mergePrivacySettings({
      retention: {
        chatHistoryDays: -10,
        predictionsDays: 3.7,
        attendanceMonths: "forever",
        gpsLocationHours: -5,
      },
    });
    expect(merged.retention.chatHistoryDays).toBe(0);
    expect(merged.retention.predictionsDays).toBe(4);
    expect(merged.retention.attendanceMonths).toBe(12); // invalid → default
    // negative GPS window is clamped to 0 (no active archive window)
    expect(merged.retention.gpsLocationHours).toBe(0);
  });

  it("preserves a valid GPS archive window", () => {
    const merged = mergePrivacySettings({
      retention: { gpsLocationHours: 720 },
    });
    expect(merged.retention.gpsLocationHours).toBe(720);
  });

  it("only accepts known deactivation modes", () => {
    expect(
      mergePrivacySettings({ deactivation: { mode: "hard", effectiveAt: "2026-08-08" } })
        .deactivation.mode,
    ).toBe("hard");
    expect(
      mergePrivacySettings({ deactivation: { mode: "nuke", effectiveAt: "x" } })
        .deactivation.mode,
    ).toBeNull();
    expect(
      mergePrivacySettings({ deactivation: { mode: "soft", effectiveAt: "2026-08-08" } })
        .deactivation.mode,
    ).toBe("soft");
  });

  it("defaults login security to secure-by-default unknowns", () => {
    const fresh = mergePrivacySettings(null);
    expect(fresh.loginSecurity.sessionTimeout).toBe("30m");
    expect(fresh.loginSecurity.requirePasswordChange90d).toBe(false);
    // Block unknown-IP logins is ON by default for a secure footprint.
    expect(fresh.loginSecurity.blockUnknownIp).toBe(true);
  });

  it("populates data-visibility defaults so the UI is never blank", () => {
    const fresh = mergePrivacySettings(null);
    expect(fresh.visibility).toEqual({
      gps: "team",
      attendance: "admins",
      contact: "team_admins",
    });
  });

  it("preserves valid visibility values and drops junk", () => {
    const merged = mergePrivacySettings({
      visibility: {
        gps: "nobody",
        attendance: "admins",
        contact: "everyone", // invalid → default
      },
    });
    expect(merged.visibility.gps).toBe("nobody");
    expect(merged.visibility.attendance).toBe("admins");
    expect(merged.visibility.contact).toBe("team_admins"); // fallback
  });

  it("sanitizes login security policy values", () => {
    const merged = mergePrivacySettings({
      loginSecurity: {
        sessionTimeout: "1h",
        requirePasswordChange90d: true,
        blockUnknownIp: false,
      },
    });
    expect(merged.loginSecurity.sessionTimeout).toBe("1h");
    expect(merged.loginSecurity.requirePasswordChange90d).toBe(true);
    expect(merged.loginSecurity.blockUnknownIp).toBe(false);

    // invalid timeout falls back to default; junk booleans fall back too
    const junk = mergePrivacySettings({
      loginSecurity: {
        sessionTimeout: "10d",
        requirePasswordChange90d: "yes",
        blockUnknownIp: 42,
      },
    });
    expect(junk.loginSecurity.sessionTimeout).toBe("30m");
    expect(junk.loginSecurity.requirePasswordChange90d).toBe(false);
    expect(junk.loginSecurity.blockUnknownIp).toBe(true);
  });
});

describe("createApiKey / revokeApiKey", () => {
  it("generates a bs_live_ key with a masked prefix and a one-time secret", () => {
    const { key, secret } = createApiKey("Drone-Telemetry-Feed", "read_write");
    expect(key.label).toBe("Drone-Telemetry-Feed");
    expect(key.scope).toBe("read_write");
    expect(key.revoked).toBe(false);
    expect(key.lastUsed).toBeNull();
    expect(secret.startsWith("bs_live_")).toBe(true);
    expect(secret).toContain(key.prefix.split("_").pop()!);
  });

  it("revoke flips only the target key", () => {
    const keys = [...DEFAULT_PRIVACY_SETTINGS.apiKeys];
    const next = revokeApiKey(keys[0].id, keys);
    expect(next[0].revoked).toBe(true);
    expect(next[1].revoked).toBe(false);
    // original array untouched
    expect(keys[0].revoked).toBe(false);
  });
});

describe("filterAuditEvents", () => {
  it("returns all events sorted newest-first with the all filter", () => {
    const out = filterAuditEvents(DEMO_AUDIT_EVENTS, { severity: "all", query: "" });
    expect(out).toHaveLength(DEMO_AUDIT_EVENTS.length);
    for (let i = 1; i < out.length; i += 1) {
      expect(new Date(out[i - 1].timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(out[i].timestamp).getTime(),
      );
    }
  });

  it("filters by severity", () => {
    const critical = filterAuditEvents(DEMO_AUDIT_EVENTS, {
      severity: "critical",
      query: "",
    });
    expect(critical.length).toBeGreaterThan(0);
    expect(critical.every((e) => e.severity === "critical")).toBe(true);
  });

  it("filters by free-text across action / actor / resource / IP / device", () => {
    const byAction = filterAuditEvents(DEMO_AUDIT_EVENTS, {
      severity: "all",
      query: "Revoked API Key",
    });
    expect(byAction.length).toBe(1);
    expect(byAction[0].action).toBe("Revoked API Key");

    const byIp = filterAuditEvents(DEMO_AUDIT_EVENTS, {
      severity: "all",
      query: "198.51.100.9",
    });
    expect(byIp.length).toBeGreaterThan(0);
    expect(byIp.every((e) => e.ip === "198.51.100.9")).toBe(true);

    const byDevice = filterAuditEvents(DEMO_AUDIT_EVENTS, {
      severity: "all",
      query: "macOS 15",
    });
    expect(byDevice.length).toBeGreaterThan(0);
    expect(byDevice.every((e) => e.device.includes("macOS 15"))).toBe(true);
  });

  it("seeds the Step 6 event set including a Revoked API Key entry", () => {
    const actions = DEMO_AUDIT_EVENTS.map((e) => e.action);
    expect(actions).toContain("Login Success");
    expect(actions).toContain("Exported Data");
    expect(actions).toContain("Changed Alert Settings");
    expect(actions).toContain("Revoked API Key");
    expect(actions).toContain("Triggered AI Plan");
    // every event carries an IP + device for the compliance columns
    expect(DEMO_AUDIT_EVENTS.every((e) => e.ip && e.device)).toBe(true);
  });

  it("returns an empty list when nothing matches", () => {
    const out = filterAuditEvents(DEMO_AUDIT_EVENTS, {
      severity: "critical",
      query: "no-such-actor",
    });
    expect(out).toHaveLength(0);
  });
});

describe("relativeAuditTime", () => {
  it("renders minutes, hours and days", () => {
    expect(relativeAuditTime(new Date(Date.now() - 5 * 60_000).toISOString())).toBe(
      "5m ago",
    );
    expect(relativeAuditTime(new Date(Date.now() - 3 * 3_600_000).toISOString())).toBe(
      "3h ago",
    );
    expect(relativeAuditTime(new Date(Date.now() - 2 * 86_400_000).toISOString())).toBe(
      "2d ago",
    );
  });
});

describe("formatAuditTimestamp", () => {
  it("renders a deterministic UTC timestamp", () => {
    expect(formatAuditTimestamp("2026-08-08T10:24:00.000Z")).toBe(
      "08 Aug 2026 · 10:24 UTC",
    );
    expect(formatAuditTimestamp("2026-01-05T23:05:00.000Z")).toBe(
      "05 Jan 2026 · 23:05 UTC",
    );
  });

  it("returns the input unchanged when the date is invalid", () => {
    expect(formatAuditTimestamp("not-a-date")).toBe("not-a-date");
  });
});

describe("auditEventsToCsv", () => {
  it("emits header + one row per event and escapes embedded quotes", () => {
    const events = [
      {
        id: "x1",
        action: "Login Success",
        actor: 'Asha "Commander" Verma',
        resource: "session",
        severity: "info" as const,
        ip: "203.0.113.1",
        device: "Chrome · Windows 11",
        timestamp: "2026-08-08T10:00:00Z",
      },
    ];
    const csv = auditEventsToCsv(events);
    expect(csv).toContain("timestamp,action,actor,resource,severity,ip,device");
    expect(csv).toContain('"Asha ""Commander"" Verma"');
    expect(csv.split("\n")).toHaveLength(2);
  });
});

describe("localStorage round-trip", () => {
  afterEach(() => {
    (globalThis as { window?: unknown }).window = undefined;
  });

  it("writes then reads the privacy snapshot unchanged", () => {
    const store = new Map<string, string | null>();
    (globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: (key: string, value: string) => store.set(key, value),
      },
    };

    const snapshot = mergePrivacySettings({
      apiKeys: [
        { id: "x", label: "Custom", scope: "read_write", lastUsed: null, ip: null, createdAt: "2026-08-01", revoked: false, prefix: "bs_live_zz" },
      ],
      retention: {
        chatHistoryDays: 7,
        predictionsDays: 60,
        attendanceMonths: 6,
        gpsLocationHours: 168,
      },
      deactivation: { mode: "soft", effectiveAt: "2026-09-01T00:00:00Z" },
    });
    writeStoredPrivacySettings(snapshot);
    const restored = readStoredPrivacySettings();

    expect(restored).toEqual(snapshot);
    expect(restored!.apiKeys[0].label).toBe("Custom");
    expect(restored!.deactivation.mode).toBe("soft");
  });
});
