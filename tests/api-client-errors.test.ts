import { describe, expect, it, vi } from "vitest";
import {
  AuthError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  InternalError,
  BaseApiError,
} from "@/lib/api/errors";
import { clientFetch } from "@/lib/api/client-fetch";

describe("Custom API Errors", () => {
  it("constructs AuthError with status 401", () => {
    const err = new AuthError("Token expired");
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("AUTH_ERROR");
    expect(err.message).toBe("Token expired");
  });

  it("constructs ValidationError with status 400 and field details", () => {
    const details = [{ field: "email", message: "Invalid email format" }];
    const err = new ValidationError("Validation failed", details);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toEqual(details);
  });

  it("constructs NotFoundError with status 404", () => {
    const err = new NotFoundError("Shelter missing");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("constructs RateLimitError with status 429 and retryAfterMs", () => {
    const err = new RateLimitError("Too many requests", 5000);
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(err.retryAfterMs).toBe(5000);
  });

  it("constructs InternalError with status 500", () => {
    const err = new InternalError("Database dead");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
  });
});

describe("clientFetch resilience and error parsing", () => {
  it("parses standardized API error response and throws typed BaseApiError", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input parameters",
          details: [{ field: "district", message: "Required" }],
          requestId: "req_12345",
        },
      }),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse)
    );

    await expect(clientFetch("/api/test", { retries: 0 })).rejects.toThrow(BaseApiError);

    try {
      await clientFetch("/api/test", { retries: 0 });
    } catch (e: unknown) {
      if (e instanceof BaseApiError) {
        expect(e.statusCode).toBe(400);
        expect(e.code).toBe("VALIDATION_ERROR");
        expect(e.message).toBe("Invalid input parameters");
        expect(e.details).toEqual([{ field: "district", message: "Required" }]);
      }
    }

    vi.unstubAllGlobals();
  });

  it("retries on network failures before succeeding", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new TypeError("Failed to fetch");
        }
        return {
          ok: true,
          json: async () => ({ status: "ok" }),
        };
      })
    );

    const onRetry = vi.fn();
    const result = await clientFetch<{ status: string }>("/api/network-test", {
      retries: 2,
      retryDelayMs: 10,
      onRetry,
    });

    expect(result.status).toBe("ok");
    expect(callCount).toBe(2);
    expect(onRetry).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
