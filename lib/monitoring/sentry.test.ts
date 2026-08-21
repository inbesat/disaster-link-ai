import { describe, it, expect } from "vitest";
import { sanitizeContext } from "./sentry";

describe("lib/monitoring/sentry - sanitizeContext", () => {
  it("scrubs passwords, tokens, and secrets", () => {
    const raw = {
      user: "john_doe",
      password: "SuperSecretPassword123",
      apiToken: "bearer xyz123",
      authHeader: "Bearer abc.def.ghi",
    };

    const sanitized = sanitizeContext(raw);

    expect(sanitized.user).toBe("john_doe");
    expect(sanitized.password).toBe("[REDACTED]");
    expect(sanitized.apiToken).toBe("[REDACTED]");
    expect(sanitized.authHeader).toBe("[REDACTED]");
  });

  it("scrubs email addresses and phone numbers", () => {
    const raw = {
      email: "user@example.com",
      phoneNumber: "1234567890",
    };

    const sanitized = sanitizeContext(raw);

    expect(sanitized.email).toBe("[REDACTED_EMAIL]");
    expect(sanitized.phoneNumber).toBe("******7890");
  });

  it("scrubs or rounds exact GPS coordinates", () => {
    const raw = {
      lat: 25.594094,
      lng: 85.137566,
      locationName: "Patna",
    };

    const sanitized = sanitizeContext(raw);

    expect(sanitized.lat).toBe(25.6);
    expect(sanitized.lng).toBe(85.1);
    expect(sanitized.locationName).toBe("Patna");
  });

  it("recursively sanitizes nested objects and arrays", () => {
    const raw = {
      request: {
        headers: {
          authorization: "Bearer secret",
        },
        body: [
          { email: "a@b.com", password: "123" },
          { phone: "9876543210" },
        ],
      },
    };

    const sanitized = sanitizeContext(raw);

    expect(sanitized.request.headers.authorization).toBe("[REDACTED]");
    expect(sanitized.request.body[0].email).toBe("[REDACTED_EMAIL]");
    expect(sanitized.request.body[0].password).toBe("[REDACTED]");
    expect(sanitized.request.body[1].phone).toBe("******3210");
  });
});
