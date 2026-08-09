// ---------------------------------------------------------------------
// server/services/alert-engine.ts
// Turns a flood prediction into physical alerts.
//
// Flow (processPredictionAlerts):
//   1. Risk normalisation — only 'high'/'warning' and 'critical'/'evacuate'
//      predictions are actionable.
//   2. Deduplication — if an alert for this district already exists within
//      the last 6 hours, skip to avoid spamming responders.
//   3. Template + rule resolution — pick the AlertTemplate / AlertRule from
//      the DB (falling back to safe defaults).
//   4. Persist to AlertLog, then fan out via SMS (Twilio) if the rule allows.
// Never throws: any failure is logged and reported as `triggered: false`.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";
import { parseAlertTemplate } from "@/lib/alerts/template-parser";
import { sendSMSAlert, type SendSmsResult } from "@/lib/alerts/twilio-client";
import { translateAlertForSMS } from "@/lib/i18n/ai-translator";
import { toLocale } from "@/lib/i18n/locales";
import { notifyAllSubscribers } from "@/server/services/push-notifier";
import type { AlertLog, UserRole } from "@prisma/client";

const DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

const DEFAULT_CHANNELS = ["sms", "in_app", "push"] as const;
const DEFAULT_TARGET_ROLES = [
  "field_responder",
  "district_admin",
  "super_admin",
] as const;

// Fallback body used when no matching AlertTemplate row exists in the DB.
const DEFAULT_TEMPLATE =
  "⚠️ {risk_level} {disaster_type} warning for {district} at {predicted_time}. Evacuate zones: {evacuation_zones}.";

export type PredictionAlertInput = {
  district?: string | null;
  lat?: number;
  lng?: number;
  riskLevel?: string;
  risk_level?: string;
  disasterType?: string;
  predictedTime?: Date | string;
  evacuationZones?: string;
};

export type ProcessPredictionAlertResult = {
  triggered: boolean;
  deduplicated: boolean;
  severity?: "warning" | "critical";
  alert?: AlertLog;
  smsResults?: SendSmsResult[];
  pushResult?: {
    ok: boolean;
    delivered: number;
    failed: number;
    skipped?: string;
  };
};

// Normalise any of the project's risk vocabularies into an actionable
// severity, or null if the prediction is below the alert threshold.
function actionableSeverity(risk: string | undefined): "warning" | "critical" | null {
  const normalized = (risk ?? "").trim().toLowerCase();
  if (normalized === "critical" || normalized === "evacuate") return "critical";
  if (normalized === "high" || normalized === "warning") return "warning";
  return null;
}

// channels / target_roles are stored as either a JSON array string
// ('["sms","in_app"]') or a comma-separated list ('sms,in_app').
function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    } catch {
      // fall through to comma split
    }
  }
  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function humanRiskLabel(severity: "warning" | "critical"): string {
  return severity === "critical" ? "Critical" : "High";
}

function formatTime(value: Date | string | undefined): string {
  if (!value) return "Unknown";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function processPredictionAlerts(
  prediction: PredictionAlertInput,
  options: { force?: boolean } = {},
): Promise<ProcessPredictionAlertResult> {
  const severity = actionableSeverity(prediction.riskLevel ?? prediction.risk_level);
  const district = prediction.district ?? null;
  const disasterType = prediction.disasterType ?? "flood";

  // Below the alert threshold — nothing to do.
  if (!severity) {
    return { triggered: false, deduplicated: false };
  }

  try {
    // -------------------------------------------------------------------
    // 1. Deduplication — one alert per district per 6 hours.
    //    Bypassed with `force` (the demo-mode AlertSimulator uses this).
    // -------------------------------------------------------------------
    if (!options.force) {
      const dedupKey = district ?? `(${prediction.lat ?? 0},${prediction.lng ?? 0})`;
      const sixHoursAgo = new Date(Date.now() - DEDUP_WINDOW_MS);
      const recent = await prisma.alertLog.findFirst({
        where: {
          district: dedupKey,
          createdAt: { gte: sixHoursAgo },
          severity: { in: ["warning", "critical"] },
        },
        orderBy: { createdAt: "desc" },
      });

      if (recent) {
        return { triggered: false, deduplicated: true, alert: recent };
      }
    }
    const dedupKey = district ?? `(${prediction.lat ?? 0},${prediction.lng ?? 0})`;

    // -------------------------------------------------------------------
    // 2. Resolve rule + template (with safe defaults).
    // -------------------------------------------------------------------
    const triggerCondition = `${severity}_${disasterType}`; // e.g. critical_flood
    const rule = await prisma.alertRule.findFirst({
      where: { isActive: true, triggerCondition },
    });

    const channels = parseList(rule?.channels);
    const targetRoles = parseList(rule?.targetRoles);
    const effectiveChannels = channels.length > 0 ? channels : [...DEFAULT_CHANNELS];
    const effectiveRoles =
      targetRoles.length > 0 ? targetRoles : [...DEFAULT_TARGET_ROLES];

    const template =
      (await prisma.alertTemplate.findFirst({
        where: { name: { in: [triggerCondition, severity] } },
      })) ?? null;

    const messageBody = template?.messageBody ?? DEFAULT_TEMPLATE;
    const message = parseAlertTemplate(messageBody, {
      risk_level: humanRiskLabel(severity),
      disaster_type: disasterType,
      district: district ?? "Unknown",
      predicted_time: formatTime(prediction.predictedTime),
      evacuation_zones: prediction.evacuationZones ?? "Unknown",
    });

    // -------------------------------------------------------------------
    // 3. Persist the alert (recorded even if SMS delivery fails).
    // -------------------------------------------------------------------
    const alert = await prisma.alertLog.create({
      data: {
        severity,
        channel: effectiveChannels.includes("sms") ? "sms" : "in_app",
        message,
        district: dedupKey,
        triggerCondition,
      },
    });

    // -------------------------------------------------------------------
    // 4. Fan out via configured channels the rule allows.
    // -------------------------------------------------------------------
    const smsResults: SendSmsResult[] = [];
    if (effectiveChannels.includes("sms")) {
      const recipients = await prisma.user.findMany({
        // roles come from alert_rule config strings; the typed UserRole cast
        // keeps the query valid against the Postgres enum (unknown role names
        // simply match no rows).
        where: { role: { in: effectiveRoles as UserRole[] }, phone: { not: null } },
        select: { id: true, name: true, phone: true, preferredLanguage: true },
      });

      // Phase 25 · Step 7 — dual-language SMS dispatch, per recipient.
      // Group recipients by preferred_language so the alert is translated
      // ONCE per language (cost-efficient), then each recipient gets their
      // own hybrid [ENGLISH] + [LOCAL] body in their chosen language.
      const byLanguage = new Map<
        string,
        { id: string; name: string | null; phone: string }[]
      >();
      for (const recipient of recipients) {
        if (!recipient.phone) continue;
        // toLocale() normalises the stored preference (e.g. "Hindi", "hi ")
        // to a valid locale code, falling back to English for bad values.
        const lang = toLocale(recipient.preferredLanguage);
        const bucket = byLanguage.get(lang) ?? [];
        bucket.push({
          id: recipient.id,
          name: recipient.name,
          phone: recipient.phone,
        });
        byLanguage.set(lang, bucket);
      }

      // Translate each language once; cache so groups share a single call.
      // (Array.from avoids `--downlevelIteration` requirement for Map loops.)
      const translatedCache = new Map<string, string>();
      for (const [lang, group] of Array.from(byLanguage.entries())) {
        // English recipients get the plain alert — no [LOCAL] mirror, so the
        // SMS stays short and costs nothing extra.
        if (lang === "en") {
          for (const recipient of group) {
            const result = await sendSMSAlert(recipient.phone, message);
            smsResults.push(result);
          }
          continue;
        }

        let localText = translatedCache.get(lang);
        if (!localText) {
          localText = await translateAlertForSMS(message, lang);
          translatedCache.set(lang, localText);
        }

        // Hybrid body: English + local-language mirror in one SMS.
        const combined = `[ENGLISH]: ${message}\n\n[LOCAL]: ${localText}`;

        // sendSMSAlert never throws — trial limits just return { ok: false }.
        for (const recipient of group) {
          const result = await sendSMSAlert(recipient.phone, combined);
          smsResults.push(result);
        }
      }
    }

    // Web Push broadcast (graceful — skipped entirely when not configured
    // or when there are no subscriptions). Never blocks the alert pipeline.
    let pushResult:
      { ok: boolean; delivered: number; failed: number; skipped?: string } | undefined;
    if (effectiveChannels.includes("push")) {
      pushResult = await notifyAllSubscribers({
        title:
          humanRiskLabel(severity) === "Critical" ? "🚨 CRITICAL ALERT" : "⚠️ HIGH ALERT",
        body: message,
        url: "/alerts",
        tag: `alert-${district ?? "district"}-${severity}`,
      });
    }

    return {
      triggered: true,
      deduplicated: false,
      severity,
      alert,
      smsResults,
      pushResult,
    };
  } catch (error) {
    console.error("[alert-engine] Failed to process prediction alert:", error);
    return { triggered: false, deduplicated: false };
  }
}
