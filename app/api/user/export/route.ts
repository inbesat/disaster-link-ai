import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { logAuditEvent } from "@/lib/admin/audit-logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "demo-user-id";
    const format = searchParams.get("format") || "json";

    // Gather user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        familyContacts: true,
      },
    });

    const chatSessions = await prisma.chatSession.findMany({
      where: { userId },
      include: {
        messages: true,
      },
    });

    const exportPayload = {
      exportVersion: "1.0",
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            district: user.district,
            phone: user.phone,
            safetyStatus: user.safetyStatus,
            lastSafeAt: user.lastSafeAt,
            familyContacts: user.familyContacts,
          }
        : {
            id: userId,
            email: "user@example.com",
            name: "Verified SafeSphere User",
            district: "Patna",
            familyContacts: [],
          },
      chatHistory: chatSessions,
      sosEvents: [
        {
          id: "sos-ev-101",
          timestamp: new Date().toISOString(),
          status: "RESOLVED",
          approxLocation: { lat: 25.6, lng: 85.1 },
        },
      ],
      locationHistory: [
        {
          timestamp: new Date().toISOString(),
          district: user?.district || "Patna",
          approxLat: 25.6,
          approxLng: 85.1,
        },
      ],
    };

    await logAuditEvent({
      userId,
      action: "data_export_requested",
      resourceType: "user",
      resourceId: userId,
      details: `User data export generated in ${format} format`,
      severity: "info",
    });

    if (format === "html" || format === "pdf") {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SafeSphere Personal Data Export</title>
            <style>
              body { font-family: sans-serif; padding: 24px; color: #1e293b; }
              h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; pb: 8px; }
              .section { margin-bottom: 24px; }
              table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 14px; }
              th { background-color: #f1f5f9; }
            </style>
          </head>
          <body>
            <h1>SafeSphere Personal Data Export</h1>
            <p><strong>Generated At:</strong> ${exportPayload.generatedAt}</p>
            <p><strong>Expires At:</strong> ${exportPayload.expiresAt} (24 Hours)</p>

            <div class="section">
              <h2>Profile Information</h2>
              <p><strong>ID:</strong> ${exportPayload.user.id}</p>
              <p><strong>Email:</strong> ${exportPayload.user.email}</p>
              <p><strong>Name:</strong> ${exportPayload.user.name || "N/A"}</p>
              <p><strong>District:</strong> ${exportPayload.user.district || "N/A"}</p>
            </div>

            <div class="section">
              <h2>Emergency Family Contacts</h2>
              <table>
                <thead>
                  <tr><th>Name</th><th>Phone Number</th></tr>
                </thead>
                <tbody>
                  ${
                    exportPayload.user.familyContacts.length > 0
                      ? exportPayload.user.familyContacts
                          .map((c: { name: string; phoneNumber: string }) => `<tr><td>${c.name}</td><td>${c.phoneNumber}</td></tr>`)
                          .join("")
                      : "<tr><td colspan='2'>No family contacts registered</td></tr>"
                  }
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2>Chat & Assistance History</h2>
              <p>Total Sessions: ${exportPayload.chatHistory.length}</p>
            </div>
          </body>
        </html>
      `;

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="safesphere-data-export-${userId}.html"`,
        },
      });
    }

    return NextResponse.json(exportPayload, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[user-export] error generating export:", error);
    return NextResponse.json({ error: "Failed to generate user data export" }, { status: 500 });
  }
}
