import { prisma } from "@/server/prisma";

export interface AuditEventOptions {
  userId?: string | null;
  action: string; // e.g. 'login', 'logout', 'shelter_updated', 'role_changed', 'permission_denied'
  resource?: string;
  resourceType?: "shelter" | "alert" | "resource" | "user" | "ai" | "system" | "plan" | string;
  resourceId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  districtId?: string | null;
  severity?: "info" | "warning" | "critical";
  details?: string | null;
  isDemo?: boolean;
  sessionId?: string | null;
}

/**
 * Writes a best-effort entry to the audit trail.
 * Intentionally swallows DB errors (logging to console) so a failed audit
 * write never breaks the caller operation that triggered it.
 */
export async function logAdminAction(
  action: string,
  resource: string,
  details?: string,
): Promise<void> {
  return logAuditEvent({
    action,
    resource,
    details,
  });
}

/**
 * Writes a structured audit event to the database.
 */
export async function logAuditEvent(options: AuditEventOptions): Promise<void> {
  try {
    const {
      userId,
      action,
      resource = options.resourceType ?? "system",
      resourceType,
      resourceId,
      oldValue,
      newValue,
      ipAddress,
      userAgent,
      districtId,
      severity = "info",
      details,
      isDemo = false,
      sessionId,
    } = options;

    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        resource,
        resourceType: resourceType ?? null,
        resourceId: resourceId ?? null,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        districtId: districtId ?? null,
        severity,
        details: details ?? null,
        isDemo,
        sessionId: sessionId ?? null,
      },
    });
  } catch (err: unknown) {
    console.error("[audit] failed to write audit log", { action: options.action }, err);
  }
}
