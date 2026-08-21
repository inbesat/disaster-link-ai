// ---------------------------------------------------------------------
// lib/settings/data-minimization.ts — Data Minimization & Retention Engine
//
// Implements GDPR / Privacy data minimization policies:
// - Approximate GPS location for general alerts / precise GPS only for SOS navigation
// - Family contacts limited to designated emergency contacts
// - Chat history retention capped to max 30 days (auto-purge / anonymization)
// - Crowdsourced reports anonymized after 90 days
// - Demo / test account auto-purge (after 24 hours)
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";

export interface ApproximateCoordinate {
  lat: number;
  lng: number;
}

/**
 * Truncates exact GPS coordinates to approximate precision (~11km approx)
 * for public broadcast alerts and non-SOS map layers.
 */
export function approximateLocation(lat: number, lng: number): ApproximateCoordinate {
  return {
    lat: Math.round(lat * 10) / 10,
    lng: Math.round(lng * 10) / 10,
  };
}

/**
 * Purges or anonymizes AI Chat messages older than 30 days.
 */
export async function purgeExpiredChatHistory(maxAgeDays: number = 30): Promise<{ purgedSessionsCount: number; purgedMessagesCount: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const oldSessions = await prisma.chatSession.findMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
      select: { id: true },
    });

    const sessionIds = oldSessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return { purgedSessionsCount: 0, purgedMessagesCount: 0 };
    }

    const messagesResult = await prisma.chatMessage.deleteMany({
      where: {
        sessionId: { in: sessionIds },
      },
    });

    const sessionsResult = await prisma.chatSession.deleteMany({
      where: {
        id: { in: sessionIds },
      },
    });

    return {
      purgedSessionsCount: sessionsResult.count,
      purgedMessagesCount: messagesResult.count,
    };
  } catch (error) {
    console.error("[data-minimization] error purging chat history:", error);
    return { purgedSessionsCount: 0, purgedMessagesCount: 0 };
  }
}

/**
 * Anonymizes crowdsourced reports older than 90 days (removes raw text detail, image URLs, exact lat/lng).
 */
export async function anonymizeOldCrowdsourcedReports(maxAgeDays: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const oldReports = await prisma.crowdsourcedReport.findMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
      select: { id: true, lat: true, lng: true },
    });

    let anonymizedCount = 0;
    for (const report of oldReports) {
      const approx = approximateLocation(report.lat, report.lng);
      await prisma.crowdsourcedReport.update({
        where: { id: report.id },
        data: {
          lat: approx.lat,
          lng: approx.lng,
          rawText: "[ANONYMIZED_AFTER_90_DAYS]",
          imageUrl: null,
        },
      });
      anonymizedCount++;
    }

    return anonymizedCount;
  } catch (error) {
    console.error("[data-minimization] error anonymizing crowdsourced reports:", error);
    return 0;
  }
}

/**
 * Auto-purges demo session data older than 24 hours.
 */
export async function purgeExpiredDemoData(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    const demoUsers = await prisma.user.deleteMany({
      where: {
        isGuest: true,
        createdAt: { lt: cutoffDate },
      },
    });

    return demoUsers.count;
  } catch (error) {
    console.error("[data-minimization] error purging demo data:", error);
    return 0;
  }
}
