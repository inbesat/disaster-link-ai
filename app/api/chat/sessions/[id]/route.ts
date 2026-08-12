import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { createRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

const sessionLimiter = createRateLimiter(30, 60_000);

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

type Params = { params: { id: string } };

/** Get a chat session with its messages. */
export async function GET(request: NextRequest, { params }: Params) {
  const rateResult = sessionLimiter(`chat-session-get:${clientIp(request)}`);
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
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
        role: body.role,
        content: body.content,
        toolName: body.toolName || null,
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

  try {
    await prisma.chatSession.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    return NextResponse.json({ ok: false, error: "Failed to delete session." }, { status: 500 });
  }
}
