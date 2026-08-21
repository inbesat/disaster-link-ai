import { describe, expect, it } from "vitest";
import { handleApiError } from "@/app/api/error-handler";
import { AuthError, ValidationError } from "@/lib/api/errors";

describe("handleApiError", () => {
  it("generates a unique errorId and returns structured JSON response", async () => {
    const error = new Error("Database query failed");
    const response = handleApiError(error);
    expect(response.status).toBe(500);

    const json = (await response.json()) as {
      ok: boolean;
      errorId: string;
      error: { code: string; message: string; requestId: string };
    };
    expect(json.ok).toBe(false);
    expect(json.errorId).toBeDefined();
    expect(json.error.code).toBe("INTERNAL_ERROR");
    expect(json.error.requestId).toBe(json.errorId);
  });

  it("returns 'Invalid credentials' for auth errors", async () => {
    const error = new Error("User not found");
    const response = handleApiError(error, null, { isAuthError: true });
    expect(response.status).toBe(401);

    const json = (await response.json()) as {
      ok: boolean;
      error: { code: string; message: string };
    };
    expect(json.error.message).toBe("Invalid credentials");
    expect(json.error.code).toBe("AUTH_ERROR");
  });

  it("handles custom BaseApiErrors like ValidationError and AuthError correctly", async () => {
    const validationErr = new ValidationError("Invalid email", [{ field: "email", message: "Invalid email format" }]);
    const valResponse = handleApiError(validationErr);
    expect(valResponse.status).toBe(400);

    const valJson = (await valResponse.json()) as {
      error: { code: string; message: string; details: Array<{ field: string; message: string }> };
    };
    expect(valJson.error.code).toBe("VALIDATION_ERROR");
    expect(valJson.error.message).toBe("Invalid email");
    expect(valJson.error.details).toEqual([{ field: "email", message: "Invalid email format" }]);

    const authErr = new AuthError("Session expired");
    const authResponse = handleApiError(authErr);
    expect(authResponse.status).toBe(401);

    const authJson = (await authResponse.json()) as {
      error: { code: string; message: string };
    };
    expect(authJson.error.code).toBe("AUTH_ERROR");
    expect(authJson.error.message).toBe("Invalid credentials");
  });
});
