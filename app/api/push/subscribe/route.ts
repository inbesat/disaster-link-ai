import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PushSubscriptionBody = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

/**
 * Validate a browser Web Push subscription payload. Returns the parsed
 * { endpoint, p256dh, auth } or null if malformed.
 */
function parseBody(body: unknown): {
  endpoint: string;
  p256dh: string;
  auth: string;
} | null {
  const raw = body as PushSubscriptionBody | undefined;
  const endpoint = raw?.endpoint;
  const p256dh = raw?.keys?.p256dh;
  const auth = raw?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https")) return null;
  if (typeof p256dh !== "string" || typeof auth !== "string") return null;
  return { endpoint, p256dh, auth };
}

export async function POST(request: NextRequest) {
  let parsed: ReturnType<typeof parseBody>;
  try {
    parsed = parseBody(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!parsed) {
    return NextResponse.json(
      { ok: false, error: "Malformed subscription." },
      { status: 400 },
    );
  }

  // Resolve the authenticated user (when present) to key the subscription.
  let userId: string | null = null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  try {
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.endpoint },
      update: { p256dh: parsed.p256dh, auth: parsed.auth, userId },
      create: {
        endpoint: parsed.endpoint,
        p256dh: parsed.p256dh,
        auth: parsed.auth,
        userId,
      },
    });
    return NextResponse.json({ ok: true, subscription });
  } catch (error) {
    console.error("[push] Failed to save subscription:", error);
    return NextResponse.json(
      { ok: false, error: "Could not save subscription." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const endpoint = request.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "Missing endpoint." }, { status: 400 });
  }

  try {
    await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[push-sub] Failed to remove subscription:", error);
    return NextResponse.json(
      { ok: false, error: "Could not remove subscription." },
      { status: 500 },
    );
  }
}
