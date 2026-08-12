import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/prisma";
import { createRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

// Rate limit: 30 chat session operations per minute per IP
const sessionsLimiter = createRateLimiter(30, 60_000);

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "anonymous";
}

async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("guest_mode")?.value === "true") return null;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** List chat sessions for the current user. */
export async function GET(request: NextRequest) {
  const rateResult = sessionsLimiter(`chat-sessions-list:${clientIp(request)}`);
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const userId = await getUserId();
  try {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { _count: { select: { messages: true } } },
    });
    return NextResponse.json({ ok: true, sessions });
  } catch (error) {
    console.error("Failed to load chat sessions:", error);
    return NextResponse.json({ ok: true, sessions: [] });
  }
}

/** Create a new chat session. */
export async function POST(request: NextRequest) {
  const rateResult = sessionsLimiter(`chat-sessions-create:${clientIp(request)}`);
  if (!rateResult.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const userId = await getUserId();
  let body: { title?: string; district?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: body.title || "New Conversation",
        district: body.district || null,
      },
    });
    return NextResponse.json({ ok: true, session });
  } catch (error) {
    console.error("Failed to create chat session:", error);
    return NextResponse.json({ ok: false, error: "Failed to create session." }, { status: 500 });
  }
}
