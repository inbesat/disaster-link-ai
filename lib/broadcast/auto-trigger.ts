// ---------------------------------------------------------------------
// lib/broadcast/auto-trigger.ts — Phase 7 · Broadcast trigger automation
// & rules engine.
//
// When the prediction pipeline reports an escalated risk for a district
// (POST /api/broadcast/fm/auto-trigger), this module:
//
//   1. Normalises the risk label (Safe/Watch/Warning/Evacuate OR
//      low/moderate/high/critical) into an actionable severity tier.
//   2. Finds the matching alert_rules_fm row (exact district > 'all').
//   3. Checks the rule's trigger_severity threshold.
//   4. Rate-limits broadcasts to MAX_BROADCASTS_PER_MINUTE.
//   5. Auto-dispatches when rule.auto_broadcast is set (generating the
//      CAP alert + running the Phase 4 dispatcher), otherwise creates a
//      pending fm_approval_requests row for the admin queue.
//
// The approval lifecycle lives here too: approveApproval() runs the full
// pipeline (CAP → dispatch), rejectApproval() records the decision, and
// autoApproveExpired() lazily approves requests past their window.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";
import type { AlertRuleFm, FmApprovalRequest } from "@prisma/client";
import { generateCapForEvent } from "@/lib/cap/cap-service";
import { dispatchToStations } from "@/lib/broadcast/fm-dispatcher";
import { districtHeadline, resolveCapPreset } from "@/lib/cap/cap-templates";
import { buildEmergencyRdsText } from "@/lib/broadcast/rds-encoder";

/** Max FM broadcasts per minute (rate limit — don't overwhelm stations). */
export const MAX_BROADCASTS_PER_MINUTE = 5;

/** Human-in-the-loop default: auto-approve after 3 minutes. */
export const DEFAULT_AUTO_APPROVE_SECONDS = 180;

/** Actionable severity tiers (mirrors the alert engine's vocabulary). */
export type FmTriggerSeverity = "warning" | "critical";

/**
 * Normalise any of the project's risk labels into an actionable severity.
 * Returns null below the action threshold (Safe/Watch/low/moderate).
 */
export function riskToSeverity(
  risk: string | null | undefined,
): FmTriggerSeverity | null {
  const normalized = (risk ?? "").trim().toLowerCase();
  if (normalized === "critical" || normalized === "evacuate") return "critical";
  if (normalized === "high" || normalized === "warning") return "warning";
  return null;
}

/** Does a rule with `triggerSeverity` fire for the current severity? */
export function ruleFiresForSeverity(
  ruleTriggerSeverity: string,
  severity: FmTriggerSeverity,
): boolean {
  const order: Record<string, number> = { warning: 0, critical: 1 };
  return (order[severity] ?? 0) >= (order[ruleTriggerSeverity] ?? 0);
}

/** Match the best active rule: exact district first, then district 'all'. */
export async function findMatchingFmRule(
  district: string,
  disasterType: string,
): Promise<AlertRuleFm | null> {
  const districtKey = district.trim().toLowerCase();
  const typeKey = (disasterType || "flood").trim().toLowerCase();

  const candidates = await prisma.alertRuleFm.findMany({
    where: {
      isActive: true,
      disasterType: { in: [typeKey, "all"] },
      district: { in: [districtKey, "all"] },
    },
  });
  if (candidates.length === 0) return null;

  return (
    candidates.find((r) => r.district.toLowerCase() === districtKey) ??
    candidates.find((r) => r.district.toLowerCase() === "all") ??
    candidates[0]
  );
}

/** Broadcasts started in the last 60 s (rate-limit gauge). */
export async function countBroadcastsInLastMinute(): Promise<number> {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  return prisma.fmBroadcastLog.count({
    where: { createdAt: { gte: oneMinuteAgo } },
  });
}

// ---------------------------------------------------------------------
// Approval preview helpers
// ---------------------------------------------------------------------

/** Approximate "stations to reach" for the approval card (active stations). */
export async function countCoveringStations(): Promise<number> {
  return prisma.fmStation.count({ where: { isActive: true } });
}

/** Build the AI voice script preview (no TTS call — preview plays on demand). */
export function buildApprovalMessage(input: {
  disasterType: string;
  district: string;
  severity: FmTriggerSeverity;
}): string {
  const preset = resolveCapPreset({
    disasterType: input.disasterType as "flood" | "cyclone" | "earthquake" | "heatwave",
    district: input.district,
    severity: input.severity === "critical" ? "Severe" : "Moderate",
  });
  const headline = districtHeadline(preset, input.district);
  return `${headline}. ${preset.description} ${preset.instruction}`;
}

/** RDS scrolling-text preview for the approval card. */
export function buildApprovalRdsText(input: {
  disasterType: string;
  district: string;
  severity: FmTriggerSeverity;
}): string {
  return buildEmergencyRdsText({
    severity: input.severity,
    disasterType: input.disasterType,
    district: input.district,
  });
}

// ---------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------

export interface AutoTriggerInput {
  disasterEventId: string;
  riskLevel: string;
  district: string;
  disasterType?: string;
  createdBy?: string | null;
  /** Override the auto-approval window for the created request. */
  autoApproveAfterSeconds?: number;
}

export interface AutoTriggerResult {
  triggered: boolean;
  mode: "auto" | "manual_approval" | "none";
  severity?: FmTriggerSeverity;
  ruleId?: string | null;
  approvalId?: string | null;
  reason?: string;
}

/**
 * The Phase 7 entry point — called by the prediction pipeline (or the
 * admin demo) when a district's risk escalates.
 */
export async function evaluateAutoTrigger(
  input: AutoTriggerInput,
): Promise<AutoTriggerResult> {
  const severity = riskToSeverity(input.riskLevel);
  if (!severity) {
    return { triggered: false, mode: "none", reason: "below-threshold" };
  }

  const rule = await findMatchingFmRule(input.district, input.disasterType ?? "flood");
  if (!rule) {
    return { triggered: false, mode: "none", reason: "no-matching-rule" };
  }
  if (!ruleFiresForSeverity(rule.triggerSeverity, severity)) {
    return { triggered: false, mode: "none", reason: "severity-below-threshold" };
  }

  const rateLimited =
    (await countBroadcastsInLastMinute()) >= MAX_BROADCASTS_PER_MINUTE;

  // Auto mode: generate the CAP alert, then run the Phase 4 dispatcher.
  if (rule.autoBroadcast && !rateLimited) {
    try {
      await generateCapForEvent(input.disasterEventId, {
        language: rule.targetLanguages[0] ?? "hi",
      });
      await dispatchToStations(input.disasterEventId);
      return {
        triggered: true,
        mode: "auto",
        severity,
        ruleId: rule.id,
      };
    } catch (error) {
      console.error("[auto-trigger] Auto dispatch failed, deferring to approval:", error);
    }
  }

  // Manual approval: rule is manual, rate-limited, or auto-dispatch failed.
  const disasterType = (input.disasterType ?? "flood").trim().toLowerCase();

  // De-duplicate: when this event already has a pending approval (e.g. a
  // Safe→Warning→Evacuate escalation within minutes), return the existing
  // request instead of piling more cards onto the admin queue.
  const existing = await prisma.fmApprovalRequest.findFirst({
    where: { disasterEventId: input.disasterEventId, status: "pending" },
  });
  if (existing) {
    return {
      triggered: true,
      mode: "manual_approval",
      severity,
      ruleId: rule.id,
      approvalId: existing.id,
      reason: "already-pending",
    };
  }

  const [message, rdsText, stationsCount] = await Promise.all([
    buildApprovalMessage({ disasterType, district: input.district, severity }),
    buildApprovalRdsText({ disasterType, district: input.district, severity }),
    countCoveringStations(),
  ]);

  const approval = await prisma.fmApprovalRequest.create({
    data: {
      disasterEventId: input.disasterEventId,
      district: input.district,
      disasterType,
      severity,
      message,
      rdsText,
      stationsCount,
      status: "pending",
      autoApproveAfterSeconds:
        input.autoApproveAfterSeconds ?? DEFAULT_AUTO_APPROVE_SECONDS,
      decidedBy: input.createdBy ?? null,
    },
  });

  return {
    triggered: true,
    mode: "manual_approval",
    severity,
    ruleId: rule.id,
    approvalId: approval.id,
    reason: rule.autoBroadcast
      ? rateLimited
        ? "rate-limited"
        : "auto-dispatch-failed"
      : "manual-approval-required",
  };
}

// ---------------------------------------------------------------------
// Approval lifecycle
// ---------------------------------------------------------------------

export interface ApproveResult {
  ok: boolean;
  error?: string;
  capAlertId?: string | null;
}

/** Run the full pipeline for an approval: CAP → dispatch → mark approved. */
export async function approveApproval(
  approvalId: string,
  opts: { message?: string; decidedBy?: string | null } = {},
): Promise<ApproveResult> {
  const approval = await prisma.fmApprovalRequest.findUnique({
    where: { id: approvalId },
  });
  if (!approval) return { ok: false, error: "Approval request not found." };
  if (approval.status !== "pending") {
    return { ok: false, error: `Approval is already ${approval.status}.` };
  }
  if (!approval.disasterEventId) {
    return { ok: false, error: "Approval has no linked disaster event." };
  }

  const generated = await generateCapForEvent(approval.disasterEventId, {
    language: "hi",
    message: opts.message ?? approval.message,
  });
  await dispatchToStations(approval.disasterEventId);

  await prisma.fmApprovalRequest.update({
    where: { id: approvalId },
    data: {
      status: "approved",
      decidedAt: new Date(),
      decidedBy: opts.decidedBy ?? null,
      capAlertId: generated.recordId,
    },
  });

  return { ok: true, capAlertId: generated.recordId };
}

/** Reject a pending approval. */
export async function rejectApproval(
  approvalId: string,
  decidedBy?: string | null,
): Promise<ApproveResult> {
  const approval = await prisma.fmApprovalRequest.findUnique({
    where: { id: approvalId },
  });
  if (!approval) return { ok: false, error: "Approval request not found." };
  if (approval.status !== "pending") {
    return { ok: false, error: `Approval is already ${approval.status}.` };
  }
  await prisma.fmApprovalRequest.update({
    where: { id: approvalId },
    data: { status: "rejected", decidedAt: new Date(), decidedBy: decidedBy ?? null },
  });
  return { ok: true };
}

/**
 * Lazily auto-approve pending requests past their window (configurable per
 * request via auto_approve_after_seconds). Runs the real dispatch — an
 * untouched critical alert must still go out. Called when the queue is read.
 */
export async function autoApproveExpired(): Promise<string[]> {
  const now = Date.now();
  const pending = await prisma.fmApprovalRequest.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  const approvedIds: string[] = [];
  for (const request of pending) {
    const deadline =
      request.createdAt.getTime() + request.autoApproveAfterSeconds * 1000;
    if (now < deadline) break; // requests are created ascending — stop early
    const result = await approveApproval(request.id).catch((error) => {
      console.error(`[auto-trigger] Auto-approval failed for ${request.id}:`, error);
      return { ok: false, error: String(error) };
    });
    if (result.ok) approvedIds.push(request.id);
  }
  return approvedIds;
}

/** Plain JSON shape for the approval queue API. */
export function serializeApproval(row: FmApprovalRequest): {
  id: string;
  disasterEventId: string | null;
  district: string;
  disasterType: string;
  severity: string;
  message: string;
  rdsText: string;
  stationsCount: number;
  status: string;
  autoApproveAt: string;
  createdAt: string;
} {
  return {
    id: row.id,
    disasterEventId: row.disasterEventId,
    district: row.district,
    disasterType: row.disasterType,
    severity: row.severity,
    message: row.message,
    rdsText: row.rdsText,
    stationsCount: row.stationsCount,
    status: row.status,
    autoApproveAt: new Date(
      row.createdAt.getTime() + row.autoApproveAfterSeconds * 1000,
    ).toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}
