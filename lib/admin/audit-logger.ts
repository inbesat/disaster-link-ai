import { prisma } from "@/server/prisma";

/**
 * Writes a best-effort entry to the audit trail.
 * Intentionally swallows DB errors (logging to console) so a failed audit
 * write never breaks the admin action that triggered it.
 */
export async function logAdminAction(
  action: string,
  resource: string,
  details?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: { action, resource, details },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", { action, resource }, err);
  }
}