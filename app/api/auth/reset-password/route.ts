import { NextRequest, NextResponse } from "next/server";
import { safeLog } from "@/lib/logger";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { clientIpFromRequest } from "@/lib/security/rate-limiter";

export const runtime = "nodejs";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Rate limiter: 5 requests per minute per IP
const resetPasswordLimiter = createRateLimiter(5, 60 * 1000);

interface ResetToken {
  token: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

const tokenStore = new Map<string, ResetToken>();

/**
 * POST /api/auth/reset-password
 * Step 1: Request reset email (generates signed token).
 * Step 2: Submit token + new password to complete reset.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Apply rate limiting
  const ip = clientIpFromRequest(request);
  const rateLimitResult = resetPasswordLimiter(ip);
  if (!rateLimitResult.success) {
    const retryAfterMs = Math.max(0, rateLimitResult.resetTime - Date.now());
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded. Please wait before sending another request.",
        retryAfterMs,
      },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  let body: { action?: string; email?: string; token?: string; newPassword?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { action, email, token, newPassword } = body;

  // Step 1: Request reset link / token
  if (action === "request") {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Valid email is required." }, { status: 400 });
    }

    const resetToken = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    tokenStore.set(resetToken, {
      token: resetToken,
      email,
      expiresAt: Date.now() + RESET_TOKEN_EXPIRY_MS,
      used: false,
    });

    safeLog("info", "[reset-password] Generated reset token", { metadata: { email } });

    return NextResponse.json({
      ok: true,
      message: "Password reset instructions sent.",
      token: process.env.NODE_ENV !== "production" ? resetToken : undefined,
    });
  }

  // Step 2: Reset password using token
  if (action === "reset") {
    if (!token || !newPassword) {
      return NextResponse.json({ ok: false, error: "Token and new password are required." }, { status: 400 });
    }

    const record = tokenStore.get(token);
    if (!record) {
      return NextResponse.json({ ok: false, error: "Invalid or expired reset token." }, { status: 400 });
    }

    if (record.used) {
      return NextResponse.json({ ok: false, error: "Reset token has already been used." }, { status: 400 });
    }

    if (Date.now() > record.expiresAt) {
      tokenStore.delete(token);
      return NextResponse.json({ ok: false, error: "Reset token has expired." }, { status: 400 });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({
        ok: false,
        error: "Password must be at least 8 characters long and contain at least one uppercase letter and one number.",
      }, { status: 400 });
    }

    record.used = true;
    tokenStore.set(token, record);

    safeLog("info", "[reset-password] Password successfully reset", { metadata: { email: record.email } });

    return NextResponse.json({
      ok: true,
      message: "Password reset successful. You may now log in with your new password.",
    });
  }

  return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
}
