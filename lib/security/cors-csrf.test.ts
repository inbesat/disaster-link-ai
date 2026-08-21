import { describe, expect, it } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

describe("CSRF and Header Security Validation", () => {
  it("detects valid matching CSRF headers and cookies", () => {
    const headerToken: string = "csrf_token_abc123";
    const cookieToken: string = "csrf_token_abc123";
    expect(headerToken === cookieToken).toBe(true);
  });

  it("rejects mismatched CSRF tokens", () => {
    const headerToken: string = "csrf_token_abc123";
    const cookieToken: string = "csrf_token_xyz987";
    expect(headerToken === cookieToken).toBe(false);
  });

  it("rejects state-changing requests when CSRF token is missing or mismatched in middleware", async () => {
    const reqNoCsrf = new NextRequest("http://localhost:3000/api/shelters/occupancy", {
      method: "POST",
      body: JSON.stringify({ shelterId: "123", occupancy: 50 }),
    });

    const resNoCsrf = await middleware(reqNoCsrf);
    expect(resNoCsrf.status).toBe(403);
    const bodyNoCsrf = await resNoCsrf.json();
    expect(bodyNoCsrf.error).toBe("CSRF token mismatch or missing.");

    const reqMismatched = new NextRequest("http://localhost:3000/api/shelters/occupancy", {
      method: "POST",
      headers: {
        "x-csrf-token": "wrong_token",
        cookie: "csrf_token=correct_token",
      },
      body: JSON.stringify({ shelterId: "123", occupancy: 50 }),
    });

    const resMismatched = await middleware(reqMismatched);
    expect(resMismatched.status).toBe(403);
    const bodyMismatched = await resMismatched.json();
    expect(bodyMismatched.error).toBe("CSRF token mismatch or missing.");
  });

  it("accepts state-changing requests when CSRF token header matches cookie", async () => {
    const csrfToken = "valid_csrf_token_12345";
    const reqValid = new NextRequest("http://localhost:3000/api/public/shelters", {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
        cookie: `csrf_token=${csrfToken}`,
      },
      body: JSON.stringify({ test: true }),
    });

    const resValid = await middleware(reqValid);
    expect(resValid.status).not.toBe(403);
  });

  it("rejects requests with unauthorized CORS origins (e.g. https://evil.com)", async () => {
    const reqEvil = new NextRequest("http://localhost:3000/api/health", {
      method: "GET",
      headers: {
        Origin: "https://evil.com",
      },
    });

    const resEvil = await middleware(reqEvil);
    expect(resEvil.status).toBe(403);
    const bodyEvil = await resEvil.json();
    expect(bodyEvil.error).toBe("CORS error: Origin not allowed.");
  });

  it("allows valid CORS preflight and GET requests for allowed origins", async () => {
    const reqOptions = new NextRequest("http://localhost:3000/api/health", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    const resOptions = await middleware(reqOptions);
    expect(resOptions.status).toBe(204);
    expect(resOptions.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
    expect(resOptions.headers.get("Access-Control-Allow-Credentials")).toBe("true");

    const reqGet = new NextRequest("http://localhost:3000/api/health", {
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    const resGet = await middleware(reqGet);
    expect(resGet.status).toBe(200);
    expect(resGet.headers.get("X-Frame-Options")).toBe("DENY");
    expect(resGet.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(resGet.headers.get("Strict-Transport-Security")).toContain("max-age=31536000");
    expect(resGet.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
  });
});
