import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAuditEvent, logAdminAction } from "./audit-logger";
import { prisma } from "@/server/prisma";

vi.mock("@/server/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("lib/admin/audit-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes structured audit event successfully", async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({
      id: "test-uuid",
      userId: "user-123",
      action: "shelter_updated",
      resource: "shelter",
      resourceType: "shelter",
      resourceId: "shelter-456",
      oldValue: { capacity: 100 },
      newValue: { capacity: 150 },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      districtId: null,
      severity: "info",
      details: "Capacity updated",
      createdAt: new Date(),
      isDemo: false,
      sessionId: null,
    } as any);

    await logAuditEvent({
      userId: "user-123",
      action: "shelter_updated",
      resourceType: "shelter",
      resourceId: "shelter-456",
      oldValue: { capacity: 100 },
      newValue: { capacity: 150 },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
      details: "Capacity updated",
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-123",
        action: "shelter_updated",
        resourceType: "shelter",
        resourceId: "shelter-456",
        oldValue: { capacity: 100 },
        newValue: { capacity: 150 },
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        severity: "info",
      }),
    });
  });

  it("backwards-compatible logAdminAction calls logAuditEvent", async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

    await logAdminAction("role_changed", "user", "Role updated to district_admin");

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "role_changed",
        resource: "user",
        details: "Role updated to district_admin",
      }),
    });
  });

  it("swallows errors gracefully without throwing", async () => {
    vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error("Database offline"));

    await expect(
      logAuditEvent({
        action: "login",
        severity: "info",
      }),
    ).resolves.not.toThrow();
  });
});
