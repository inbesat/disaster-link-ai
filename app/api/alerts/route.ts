import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest) {
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
  } catch (error) {
    console.error("Failed to load alerts:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load alerts." },
      { status: 500 },
    );
  }
}

// Mark one alert as acknowledged (mark-read).
export async function PATCH(request: NextRequest) {
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
  } catch (error) {
    console.error("Failed to acknowledge alert:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to acknowledge alert." },
      { status: 500 },
    );
  }
}
