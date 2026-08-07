"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/prisma";
import { detectSpam } from "@/lib/data-ingestion/spam-filter";
import { sanitizeInput } from "@/lib/security/sanitize";

// ---------------------------------------------------------------------
// app/actions/reports.ts
// Phase 17 — Crowdsourced Ground Truth ingestion.
// A citizen submits a ground-truth report (GPS + type + description + photo).
// The action runs the spam/duplicate filter (Phase 17 Step 7) and, only if
// the report is clean, inserts a new `unverified` CrowdsourcedReport row.
// On any DB failure it degrades to a mock success so the public demo never
// crashes (mirrors the mock-fallback convention used across app/actions).
// ---------------------------------------------------------------------

export type CitizenReportInput = {
  lat: number;
  lng: number;
  reportType: "flooding" | "road_blocked" | "shelter_needed" | "rescue";
  rawText: string;
  source?: "social" | "app" | "sms";
  imageUrl?: string | null;
};

export type SubmitReportResult = {
  ok: boolean;
  id: string;
  message?: string;
};

const REPORT_TYPES = ["flooding", "road_blocked", "shelter_needed", "rescue"] as const;

/**
 * Persist a citizen ground-truth report. Sanitises inputs, defaults source to
 * "app", leaves verification_status "unverified" for the response team. Runs
 * the Phase 17 spam filter against recent DB reports first so trolls/bots are
 * rejected — duplicate text or >5 reports from one location within a minute.
 */
export async function submitCitizenReport(
  input: CitizenReportInput,
): Promise<SubmitReportResult> {
  const reportType = REPORT_TYPES.includes(input.reportType as never)
    ? input.reportType
    : "flooding";
  // Phase 21 · strip XSS vectors before anything touches the database. PII is
  // redacted at display time (triage/map) so response teams keep operational
  // contact details while public surfaces never surface them.
  const rawText = sanitizeInput(String(input.rawText ?? "").trim()).slice(0, 2000);
  const source =
    input.source === "social" || input.source === "sms" ? input.source : "app";
  const imageUrl = input.imageUrl ? String(input.imageUrl).slice(0, 1000) : null;

  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return {
      ok: false,
      id: "",
      message: "Location is required. Use the GPS button to set your position.",
    };
  }
  if (!rawText) {
    return { ok: false, id: "", message: "Please describe the situation." };
  }

  try {
    // Phase 17 Step 7 — pull recent reports and run the spam filter.
    const recent = await prisma.crowdsourcedReport.findMany({
      select: { lat: true, lng: true, rawText: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const spam = detectSpam(
      { lat: input.lat, lng: input.lng, rawText, createdAt: new Date() },
      recent.map((r) => ({
        lat: r.lat,
        lng: r.lng,
        rawText: r.rawText,
        createdAt: r.createdAt,
      })),
    );

    if (spam.isSpam) {
      console.warn(`[reports] Spam rejected (${spam.reason}): "${rawText}"`);
      return {
        ok: false,
        id: "",
        message:
          spam.reason === "duplicate_text"
            ? "This report looks like a duplicate already received. Stay safe."
            : "Too many reports from your location in a short time. Please wait and try again.",
      };
    }

    const report = await prisma.crowdsourcedReport.create({
      data: {
        lat: input.lat,
        lng: input.lng,
        reportType,
        source,
        rawText,
        confidenceScore: 0.5,
        verificationStatus: "unverified",
        imageUrl,
      },
    });

    revalidatePath("/report");
    return { ok: true, id: report.id };
  } catch (error) {
    console.warn("[reports] submitCitizenReport fell back to mock success.", error);
    return {
      ok: true,
      id: `mock-${Date.now()}`,
      message: "Demo mode — report recorded (DB bypassed).",
    };
  }
}
