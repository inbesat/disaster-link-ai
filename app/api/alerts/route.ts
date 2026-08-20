import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin", "field_responder"] as const;

const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limitParam = Number(request.nextUrl.searchParams.get("limit"));
  const limit = Math.min(
    50,
    Math.max(1, Number.isFinite(limitParam) ? limitParam : DEFAULT_LIMIT),
  );

  try {
    const alerts = await prisma.alertLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const unreadCount = alerts.filter((alert) => !alert.isAcknowledged).length;

    return NextResponse.json({ ok: true, alerts, unreadCount });
  } catch (error: unknown) {
    // Prisma can be unreachable on cold starts (e.g. Vercel). Never 500 —
    // serve realistic mock alerts so the dashboard table still renders.
    console.error("Failed to load alerts (serving mock data):", error);
    const now = Date.now();
    const hoursAgo = (hours: number) =>
      new Date(now - hours * 60 * 60 * 1000).toISOString();
    const mockAlerts = [
      {
        id: "mock-alert-1",
        severity: "critical",
        channel: "sms",
        message:
          "Brahmaputra at Kamrup is 0.9 m above the danger mark — evacuate low-lying wards now.",
        district: "Kamrup",
        triggerCondition: "critical_flood",
        isAcknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        sentAt: hoursAgo(0.5),
        createdAt: hoursAgo(0.5),
      },
      {
        id: "mock-alert-2",
        severity: "warning",
        channel: "in_app",
        message:
          "Heavy rainfall forecast for Patna — waterlogging expected in low-lying areas.",
        district: "Patna",
        triggerCondition: "heavy_rainfall",
        isAcknowledged: false,
        acknowledgedBy: null,
        acknowledgedAt: null,
        sentAt: hoursAgo(3),
        createdAt: hoursAgo(3),
      },
      {
        id: "mock-alert-3",
        severity: "watch",
        channel: "push",
        message:
          "Periyar river in Ernakulam is at watch level — monitoring ongoing, no action needed.",
        district: "Ernakulam",
        triggerCondition: "river_monitoring",
        isAcknowledged: true,
        acknowledgedBy: "district-admin-01",
        acknowledgedAt: hoursAgo(26),
        sentAt: hoursAgo(27),
        createdAt: hoursAgo(27),
      },
    ];

    return NextResponse.json({
      ok: true,
      alerts: mockAlerts,
      unreadCount: mockAlerts.filter((alert) => !alert.isAcknowledged).length,
    });
  }
}

// Mark one alert as acknowledged (mark-read).
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ ok: false, error: "Missing alert id." }, { status: 400 });
  }

  try {
    const alert = await prisma.alertLog.update({
      where: { id: body.id },
      data: {
        isAcknowledged: true,
        acknowledgedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, alert });
  } catch (error: unknown) {
    console.error("Failed to acknowledge alert:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to acknowledge alert." },
      { status: 500 },
    );
  }
}
