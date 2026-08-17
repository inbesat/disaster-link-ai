import { NextRequest, NextResponse } from "next/server";
import { notifyAllSubscribers } from "@/server/services/push-notifier";
import { requireRole } from "@/lib/security/require-role";
import { GOV_ROLES } from "@/lib/validations/user";

export const runtime = "nodejs";

const PUSHABLE_PRIORITIES = ["CRITICAL", "HIGH"] as const;

/**
 * POST /api/assignments/notify
 * Command-room dispatch of a new field task. Sends a Web Push notification to
 * every subscribed responder when the task is CRITICAL or HIGH priority —
 * Phase 19 step 9 ("push notification support for critical task assignments").
 *
 * Body:
 *   { title: string, priority: "CRITICAL" | "HIGH" | "ROUTINE", location?: string }
 */
export async function POST(request: NextRequest) {
  // Security: this endpoint broadcasts Web Push to every subscribed responder
  // — an anonymous caller could spam all field staff with fake critical alerts.
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  let body: { title?: unknown; priority?: unknown; location?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const priority = String(body.priority ?? "").toUpperCase();
  const location = typeof body.location === "string" ? body.location.trim() : "";

  if (!title) {
    return NextResponse.json({ ok: false, error: "title is required." }, { status: 400 });
  }
  if (!(PUSHABLE_PRIORITIES as readonly string[]).includes(priority)) {
    // ROUTINE tasks don't warrant an interrupt — acknowledged, but no push.
    const reason =
      priority === "ROUTINE"
        ? "Routine tasks are not pushed."
        : `Priority "${priority || "(missing)"}" is not eligible for push.`;
    return NextResponse.json({
      ok: true,
      pushed: false,
      reason,
      push: { skipped: reason },
    });
  }

  const push = await notifyAllSubscribers({
    title: `🚨 New ${priority} Task`,
    body: `${title}${location ? ` — ${location}` : ""}`,
    url: "/field",
    tag: `task-${priority.toLowerCase()}-${Date.now()}`,
  });

  return NextResponse.json({ ok: true, pushed: true, push });
}
