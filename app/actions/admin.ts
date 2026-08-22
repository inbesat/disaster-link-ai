"use server";

import type { Role } from "@/lib/validations/user";
import { logAdminAction } from "@/lib/admin/audit-logger";
import { DEMO_AUDIT_EVENTS, type AuditEvent } from "@/lib/settings/privacy-settings";
import { requireRole } from "@/lib/security/require-role";

const ADMIN_ROLES = ["super_admin", "district_admin"] as const;

export interface DistrictConfig {
  district: string;
  criticalRainThresholdMm: number;
  riverDangerMarkM: number;
  autoAlertSms: boolean;
}

export interface SaveConfigResult {
  success: boolean;
  saved: DistrictConfig;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: Role;
  assignedDistrict: string;
  phone: string;
  status: "active" | "inactive";
  lastActive: string;
}

let mockUsers: AdminUser[] = [
  {
    id: "u_1",
    name: "Meera Krishnan",
    email: "meera.k@ndrf.gov.in",
    organization: "NDRF",
    role: "district_admin",
    assignedDistrict: "Sitamarhi",
    phone: "+919812233445",
    status: "active",
    lastActive: "2 min ago",
  },
  {
    id: "u_2",
    name: "Arvind Sharma",
    email: "arvind.sharma@bihar.in",
    organization: "Govt",
    role: "district_admin",
    assignedDistrict: "Muzaffarpur",
    phone: "+919845677890",
    status: "active",
    lastActive: "14 min ago",
  },
  {
    id: "u_3",
    name: "Priya Nand",
    email: "priya.n@redcross.in",
    organization: "NGO",
    role: "field_responder",
    assignedDistrict: "Darbhanga",
    phone: "+919902211445",
    status: "active",
    lastActive: "1 hr ago",
  },
  {
    id: "u_4",
    name: "Rahul Verma",
    email: "rahul.v@sdrf.in",
    organization: "SDRF",
    role: "field_responder",
    assignedDistrict: "Sitamarhi",
    phone: "+919812345678",
    status: "inactive",
    lastActive: "3 days ago",
  },
  {
    id: "u_5",
    name: "Divya Iyer",
    email: "divya.iyer@collector.in",
    organization: "Govt",
    role: "viewer",
    assignedDistrict: "Sitamarhi",
    phone: "+919878900011",
    status: "active",
    lastActive: "12 hr ago",
  },
];

export async function listUsers(): Promise<AdminUser[]> {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");
  return mockUsers;
}

export async function changeUserRole(
  id: string,
  role: Role,
): Promise<AdminUser[]> {
  const auth = await requireRole(["super_admin"] as const);
  if (!auth.ok) throw new Error("Unauthorized: super_admin access required to change roles.");

  // Validate the role value
  const validRoles: Role[] = ["super_admin", "district_admin", "field_responder", "viewer"];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const targetUser = mockUsers.find((u) => u.id === id);
  const oldRole = targetUser?.role ?? "unknown";

  mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, role } : u));

  await logAdminAction(
    "CHANGE_USER_ROLE",
    `user:${id}`,
    `role changed from ${oldRole} to ${role} by ${auth.role}`,
  );

  return mockUsers;
}

export async function deactivateUser(id: string): Promise<AdminUser[]> {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");

  mockUsers = mockUsers.map((u) =>
    u.id === id ? { ...u, status: "inactive" as const } : u,
  );
  return mockUsers;
}

export async function reactivateUser(id: string): Promise<AdminUser[]> {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");

  mockUsers = mockUsers.map((u) =>
    u.id === id ? { ...u, status: "active" as const } : u,
  );
  return mockUsers;
}

export async function executeBulkAction(
  actionCode: string,
  resource: string,
  details?: string,
): Promise<void> {
  const auth = await requireRole(["super_admin"] as const);
  if (!auth.ok) throw new Error("Unauthorized: super_admin access required for bulk operations.");

  // Validate actionCode to prevent injection
  if (!/^[A-Z_]{3,50}$/.test(actionCode)) {
    throw new Error("Invalid action code format.");
  }

  await logAdminAction(actionCode, resource, details);
}

export async function saveDistrictConfig(
  config: DistrictConfig,
): Promise<SaveConfigResult> {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");

  // Validate config values
  if (typeof config.criticalRainThresholdMm !== "number" || config.criticalRainThresholdMm < 0) {
    throw new Error("Invalid rain threshold value.");
  }
  if (typeof config.riverDangerMarkM !== "number" || config.riverDangerMarkM < 0) {
    throw new Error("Invalid river danger mark value.");
  }

  await logAdminAction(
    "UPDATED_DISTRICT_CONFIG",
    `district:${config.district}`,
    `rainThreshold=${config.criticalRainThresholdMm}mm · riverDanger=${config.riverDangerMarkM}m · autoSms=${config.autoAlertSms}`,
  );
  return { success: true, saved: config };
}

/**
 * List security-relevant audit events for the admin Audit Logs console.
 */
export async function listAuditLogs(): Promise<AuditEvent[]> {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");
  return DEMO_AUDIT_EVENTS.map((event) => ({ ...event }));
}

// ---------------------------------------------------------------------
// Gov access-request management (/access-requests).
//
// Prisma-first with an in-memory mock fallback, mirroring every other
// admin surface: when DATABASE_URL points at a real Postgres with the
// access_requests table migrated, decisions persist; until then they
// live in mock memory for the demo and reset on server restart.
// ---------------------------------------------------------------------

export type AccessRequestStatus = "pending" | "approved" | "rejected";

export interface AccessRequestRecord {
  id: string;
  name: string;
  email: string;
  organization: string;
  requestedRole: "field_responder" | "district_admin";
  idFileName: string | null;
  message: string | null;
  status: AccessRequestStatus;
  createdAt: string; // ISO
}

let mockAccessRequests: AccessRequestRecord[] = [
  {
    id: "ar_demo_1",
    name: "Cdr. Asha Verma",
    email: "asha.verma@ndrf.gov.in",
    organization: "NDRF",
    requestedRole: "field_responder",
    idFileName: "ndrf-id-asha.pdf",
    message: "NDRF Battalion 9 — deployed to Sitamarhi sector.",
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "ar_demo_2",
    name: "Suresh Patil",
    email: "s.patil@sdrf.in",
    organization: "SDRF",
    requestedRole: "district_admin",
    idFileName: "sdrf-card-patil.jpg",
    message: null,
    status: "approved",
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];

function normalizeRequest(r: {
  id: string;
  name: string;
  email: string;
  organization: string;
  requestedRole: string;
  idFileName: string | null;
  message: string | null;
  status: string;
  createdAt: Date;
}): AccessRequestRecord {
  return {
    ...r,
    requestedRole:
      r.requestedRole === "district_admin" ? "district_admin" : "field_responder",
    status: (["pending", "approved", "rejected"] as const).includes(
      r.status as AccessRequestStatus,
    )
      ? (r.status as AccessRequestStatus)
      : "pending",
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listAccessRequests(): Promise<AccessRequestRecord[]> {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");

  try {
    const { prisma } = await import("@/server/prisma");
    const rows = await prisma.accessRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map(normalizeRequest);
  } catch {
    // Table missing / DB unreachable — serve the in-memory demo list.
    return [...mockAccessRequests];
  }
}

export async function decideAccessRequest(
  id: string,
  decision: Exclude<AccessRequestStatus, "pending">,
  role?: "field_responder" | "district_admin",
): Promise<AccessRequestRecord[]> {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");

  if (decision !== "approved" && decision !== "rejected") {
    throw new Error(`Invalid decision: ${decision}`);
  }

  const target = mockAccessRequests.find((r) => r.id === id);

  try {
    const { prisma } = await import("@/server/prisma");
    await prisma.accessRequest.update({
      where: { id },
      data: {
        status: decision,
        decidedAt: new Date(),
        ...(decision === "approved" && role ? { requestedRole: role } : {}),
      },
    });
  } catch {
    // DB write unavailable — mutate the mock so the demo UI stays coherent.
    mockAccessRequests = mockAccessRequests.map((r) =>
      r.id === id
        ? {
            ...r,
            status: decision,
            ...(decision === "approved" && role ? { requestedRole: role } : {}),
          }
        : r,
    );
  }

  await logAdminAction(
    decision === "approved" ? "APPROVE_ACCESS_REQUEST" : "REJECT_ACCESS_REQUEST",
    `access_request:${id}`,
    `${target?.email ?? "unknown"} ${decision}${role ? ` as ${role}` : ""} by ${auth.role}`,
  );

  // Return the freshest view we can (DB preferred, mock as fallback).
  try {
    const { prisma } = await import("@/server/prisma");
    const rows = await prisma.accessRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map(normalizeRequest);
  } catch {
    return [...mockAccessRequests];
  }
}
