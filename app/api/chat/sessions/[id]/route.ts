import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireSession } from "@/lib/security/require-role";
import { sanitizeInput } from "@/lib/security/sanitize";
import { createRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const sessionLimiter = createRateLimiter(30, 60_000);

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

/**
 * Resolve the caller's session identity (guest/role cookie or Supabase user).
 * Returns null for fully anonymous callers — they are rejected before any
 * DB read or write.
 */
async function resolveCallerId(): Promise<string | null> {
  const auth = await requireSession();
  if (!auth.ok) return null;
  // Guest/role-cookie sessions have no stable user id; the ownership check
  // below only applies when the session row itself carries a userId.
  return auth.ok && auth.role !== "guest" && !auth.role.startsWith("user_")
    ? auth.role
    : null;
}

type Params = { params: { id: string } };

/**
 * Ownership gate: a chat session owned by a real user may only be read /
 * written / deleted by that same user. Demo sessions (userId = null) remain
 * reachable by any signed-in visitor so the sandbox chat demo keeps working.
 */
async function assertOwnership(request: NextRequest, sessionId: string) {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });
    if (!session) return null; // 404 handled by the caller.
    const callerId = await resolveCallerId();
    if (session.userId && callerId && session.userId !== callerId) {
      return { status: 403 as const, body: { ok: false, error: "Forbidden: session does not belong to you." } };
    }
    return session;
  } catch (error) {
    console.error("Failed to check chat session ownership:", error);
    return null;
  }
}

/** Get a chat session with its messages. */
export async function GET(request: NextRequest, { params }: Params) {
  const rateResult = sessionLimiter(`chat-session-get:${clientIp(request)}`);
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // Security (IDOR): anonymous callers may not read chat history.
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const owned = await assertOwnership(request, params.id);
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
  }
  if ("status" in owned) {
    return NextResponse.json(owned.body, { status: owned.status });
  }

  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: params.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) {
      return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    console.error("Failed to load chat session:", error);
    return NextResponse.json({ ok: false, error: "Failed to load session." }, { status: 500 });
  }
}

/** Add a message to a chat session. */
export async function POST(request: NextRequest, { params }: Params) {
  const rateResult = sessionLimiter(`chat-session-add:${clientIp(request)}`);
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // Security (IDOR + XSS): anonymous callers may not write messages, and the
  // stored content is XSS-stripped before persisting.
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const owned = await assertOwnership(request, params.id);
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
  }
  if ("status" in owned) {
    return NextResponse.json(owned.body, { status: owned.status });
  }

  let body: { role?: string; content?: string; toolName?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.role || !body.content) {
    return NextResponse.json({ ok: false, error: "role and content are required." }, { status: 400 });
  }

  try {
    const message = await prisma.chatMessage.create({
      data: {
        sessionId: params.id,
        role: sanitizeInput(body.role).slice(0, 50),
        content: sanitizeInput(body.content).slice(0, 10_000),
        toolName: body.toolName ? sanitizeInput(body.toolName).slice(0, 100) : null,
      },
    });
    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error("Failed to add message:", error);
    return NextResponse.json({ ok: false, error: "Failed to add message." }, { status: 500 });
  }
}

/** Delete a chat session. */
export async function DELETE(request: NextRequest, { params }: Params) {
  const rateResult = sessionLimiter(`chat-session-delete:${clientIp(request)}`);
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  // Security (IDOR): anonymous callers may not delete sessions.
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const owned = await assertOwnership(request, params.id);
  if (!owned) {
    return NextResponse.json({ ok: false, error: "Session not found." }, { status: 404 });
  }
  if ("status" in owned) {
    return NextResponse.json(owned.body, { status: owned.status });
  }

  try {
    await prisma.chatSession.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    return NextResponse.json({ ok: false, error: "Failed to delete session." }, { status: 500 });
  }
}
