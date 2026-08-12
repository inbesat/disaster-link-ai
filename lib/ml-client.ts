// ---------------------------------------------------------------------
// ML bridge: Next.js <-> Python FastAPI flood-risk microservice.
// Server-only (uses Prisma). Wraps the live XGBoost prediction in a safe
// API that never crashes the app if the Python service is unreachable.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";
import { nearestDistrict } from "@/lib/data-ingestion/fetcher";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 3000;

// Numeric class (0-3) -> UI-facing risk label.
const RISK_LABELS = ["Safe", "Watch", "Warning", "Evacuate"] as const;
export type RiskLabel = (typeof RISK_LABELS)[number];

// Risk ordering — used to detect escalations that warrant an alert.
const RISK_ORDER: Record<RiskLabel, number> = {
  Safe: 0,
  Watch: 1,
  Warning: 2,
  Evacuate: 3,
};

// Map UI risk labels onto the alert_logs.severity vocabulary.
const ALERT_SEVERITY: Partial<Record<RiskLabel, string>> = {
  Warning: "warning",
  Evacuate: "critical",
};

export type FloodPredictionResult = {
  riskLevel: RiskLabel;
  confidenceScore: number;
  source: "ml" | "fallback";
  lat: number;
  lng: number;
  predictedAt: string;
};

type PredictPayload = {
  cumulative_rainfall_72h: number;
  river_level_trend: number;
  soil_saturation_index: number;
  elevation_m: number;
};

export type FloodPredictionOptions = {
  // Override the derived soil saturation (0-1). If omitted it is derived
  // from rainfall (rainfall / 250, clamped).
  soilSaturation?: number;
};

// Defaults mirror the generator's physical relationships so the model
// still gets meaningful inputs when only rainfall/elevation are known.
function buildPayload(
  rainfall: number,
  elevation: number,
  options: FloodPredictionOptions = {},
): PredictPayload {
  const soilSaturation = options.soilSaturation ?? rainfall / 250;
  return {
    cumulative_rainfall_72h: rainfall,
    river_level_trend: Number((rainfall * 0.012).toFixed(3)),
    soil_saturation_index: Number(Math.min(1, Math.max(0, soilSaturation)).toFixed(4)),
    elevation_m: elevation,
  };
}

function fallback(lat: number, lng: number): FloodPredictionResult {
  return {
    riskLevel: "Safe",
    confidenceScore: 0,
    source: "fallback",
    lat,
    lng,
    predictedAt: new Date().toISOString(),
  };
}

export async function getFloodPrediction(
  lat: number,
  lng: number,
  rainfall: number,
  elevation: number,
  options: FloodPredictionOptions = {},
): Promise<FloodPredictionResult> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(rainfall, elevation, options)),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`ML service responded with status ${response.status}`);
    }

    const data = (await response.json()) as {
      predicted_risk_class: number;
      risk_level: string;
      confidence_score: number;
    };

    const classIndex = Math.min(
      RISK_LABELS.length - 1,
      Math.max(0, Math.floor(Number(data.predicted_risk_class) || 0)),
    );
    const riskLevel = RISK_LABELS[classIndex];
    const confidenceScore = Number(data.confidence_score) || 0;

    // Elevation-aware alerting: if the risk has *escalated* at this location
    // into an action band (Warning / Evacuate), push a row into alert_logs so
    // the orchestrator can fan it out (SMS/push/siren).
    await maybeTriggerAlert(lat, lng, riskLevel);

    await prisma.floodPrediction.create({
      data: {
        lat,
        lng,
        predictionTimestamp: new Date(),
        riskLevel,
        confidenceScore,
      },
    });

    return {
      riskLevel,
      confidenceScore,
      source: "ml",
      lat,
      lng,
      predictedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("ML service unreachable, returning default 'Safe':", error);
    return fallback(lat, lng);
  }
}

/**
 * Logs an alert when the predicted risk at a location escalates into an
 * action band. De-duplicated: an alert is only written the first time a
 * location reaches a given severity (or escalates to a higher one), so the
 * demo doesn't spam alert_logs on every map pan.
 */
async function maybeTriggerAlert(lat: number, lng: number, riskLevel: RiskLabel) {
  const severity = ALERT_SEVERITY[riskLevel];
  if (!severity) return; // Safe / Watch are not action alerts.

  const newLevel = RISK_ORDER[riskLevel];

  try {
    const previous = await prisma.floodPrediction.findFirst({
      where: { lat, lng },
      orderBy: { predictionTimestamp: "desc" },
    });

    if (previous) {
      const prevLevel = RISK_ORDER[(previous.riskLevel as RiskLabel) ?? "Safe"] ?? 0;
      if (prevLevel >= newLevel) return; // not an escalation
    }

    await prisma.alertLog.create({
      data: {
        severity,
        channel: "push",
        message: `Flood risk escalated to ${riskLevel} at (${lat.toFixed(4)}, ${lng.toFixed(4)}). Responders should prepare.`,
      },
    });

    // Phase 7 · FM broadcast automation: the prediction pipeline now feeds
    // the FM rules engine (auto-dispatch or admin approval) exactly when a
    // prediction escalates into an action band. Fire-and-forget so the
    // prediction response is never delayed by the broadcast pipeline.
    const place = nearestDistrict(lat, lng);
    void triggerFmBroadcast({
      district: place.name,
      riskLevel,
    }).catch((error) => {
      console.warn("[ml-client] FM broadcast automation failed:", error);
    });
  } catch (error) {
    console.warn("Failed to log flood alert:", error);
  }
}

/**
 * Phase 7 · FM broadcast automation hook.
 *
 * Find-or-create the active flood disaster event for the escalated
 * district, then evaluate the alert_rules_fm rules via evaluateAutoTrigger:
 *   - auto_broadcast rule → CAP alert generated + Phase 4 dispatch starts;
 *   - manual rule (or rate-limited) → a pending approval lands in the admin
 *     Broadcast Approval Queue for sign-off.
 * Never throws — broadcast failures must not break the prediction path.
 */
async function triggerFmBroadcast(opts: {
  district: string;
  riskLevel: RiskLabel;
}): Promise<void> {
  try {
    // `contains` so the resolver's "Patna" reuses seeded events like
    // "Patna (Ganga)" instead of creating a duplicate active event.
    const event =
      (await prisma.disasterEvent.findFirst({
        where: {
          type: "flood",
          district: { contains: opts.district },
          status: "active",
        },
        orderBy: { createdAt: "desc" },
      })) ??
      (await prisma.disasterEvent.create({
        data: {
          name: `Flood risk — ${opts.district}`,
          type: "flood",
          status: "active",
          district: opts.district,
          startedAt: new Date(),
        },
      }));

    // Lazy import — the FM chain pulls in Twilio + TTS providers. Loading
    // it only when an escalation fires keeps the hot prediction path light
    // (same convention as lib/demo/reset-scenario.ts) and means a failure
    // in that chain can never break prediction responses.
    const { evaluateAutoTrigger } = await import("@/lib/broadcast/auto-trigger");

    const result = await evaluateAutoTrigger({
      disasterEventId: event.id,
      riskLevel: opts.riskLevel,
      district: opts.district,
      disasterType: "flood",
    });
    if (result.mode !== "none") {
      console.log(
        `[ml-client] FM broadcast automation — ${opts.district}: ${result.mode}`,
        result,
      );
    }
  } catch (error) {
    console.warn("[ml-client] FM broadcast automation failed:", error);
  }
}
