import { describe, expect, it, vi, beforeEach } from "vitest";
import { safeLog } from "./logger";

describe("safeLog", () => {
  const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redacts sensitive fields like passwords, tokens, and phone numbers", () => {
    safeLog("info", "User action", {
      metadata: {
        password: "mySecretPassword123",
        token: "bearer-xyz",
        phoneNumber: "+919876543210",
        regularKey: "normalValue",
      },
    });

    expect(consoleInfoSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    const metadata = logged.metadata as Record<string, unknown>;
    expect(metadata.password).toBe("[REDACTED]");
    expect(metadata.token).toBe("[REDACTED]");
    expect(metadata.phoneNumber).toBe("[REDACTED]");
    expect(metadata.regularKey).toBe("normalValue");
  });

  it("rounds lat/lng coordinates to 2 decimal places", () => {
    safeLog("info", "Coordinates check", {
      metadata: {
        lat: 25.5941234,
        lng: 85.1376891,
      },
    });

    expect(consoleInfoSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(consoleInfoSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    const metadata = logged.metadata as Record<string, unknown>;
    expect(metadata.lat).toBe(25.59);
    expect(metadata.lng).toBe(85.14);
  });

  it("formats log entry with structured fields", () => {
    safeLog("warn", "Warning alert", {
      userId: "u-123",
      action: "FETCH_RESOURCES",
    });

    expect(consoleWarnSpy).toHaveBeenCalledOnce();
    const logged = JSON.parse(consoleWarnSpy.mock.calls[0][0] as string) as Record<string, unknown>;
    expect(logged.level).toBe("warn");
    expect(logged.message).toBe("Warning alert");
    expect(logged.userId).toBe("u-123");
    expect(logged.action).toBe("FETCH_RESOURCES");
    expect(logged.timestamp).toBeDefined();
  });
});
