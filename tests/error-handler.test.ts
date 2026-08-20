import { describe, expect, it } from "vitest";
import { handleApiError } from "@/app/api/error-handler";

describe("handleApiError", () => {
  it("generates a unique errorId and returns structured JSON response", async () => {
    const error = new Error("Database query failed");
    const response = handleApiError(error);
    expect(response.status).toBe(500);

    const json = (await response.json()) as { ok: boolean; error: string; errorId: string };
    expect(json.ok).toBe(false);
    expect(json.errorId).toBeDefined();
    expect(typeof json.errorId).toBe("string");
  });

  it("returns 'Invalid credentials' for auth errors", async () => {
    const error = new Error("User not found");
    const response = handleApiError(error, null, { isAuthError: true });
    expect(response.status).toBe(401);

    const json = (await response.json()) as { ok: boolean; error: string };
    expect(json.error).toBe("Invalid credentials");
  });
});
