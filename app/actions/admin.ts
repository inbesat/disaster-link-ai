"use server";

import type { Role } from "@/lib/validations/user";
import { logAdminAction } from "@/lib/admin/audit-logger";
import { DEMO_AUDIT_EVENTS, type AuditEvent } from "@/lib/settings/privacy-settings";

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
  return mockUsers;
}

export async function changeUserRole(
  id: string,
  role: Role,
): Promise<AdminUser[]> {
  mockUsers = mockUsers.map((u) => (u.id === id ? { ...u, role } : u));
  return mockUsers;
}

export async function deactivateUser(id: string): Promise<AdminUser[]> {
  mockUsers = mockUsers.map((u) =>
    u.id === id ? { ...u, status: "inactive" as const } : u,
  );
  return mockUsers;
}

export async function reactivateUser(id: string): Promise<AdminUser[]> {
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
  await logAdminAction(actionCode, resource, details);
}

export async function saveDistrictConfig(
  config: DistrictConfig,
): Promise<SaveConfigResult> {
  await logAdminAction(
    "UPDATED_DISTRICT_CONFIG",
    `district:${config.district}`,
    `rainThreshold=${config.criticalRainThresholdMm}mm · riverDanger=${config.riverDangerMarkM}m · autoSms=${config.autoAlertSms}`,
  );
  return { success: true, saved: config };
}

/**
 * List security-relevant audit events for the admin Audit Logs console.
 *
 * Phase 18 · Step 5 — returns the seeded demo trail so the console is
 * always populated. A production build would read rows from the
 * audit_logs table (written by logAdminAction) via Prisma.
 */
export async function listAuditLogs(): Promise<AuditEvent[]> {
  return DEMO_AUDIT_EVENTS.map((event) => ({ ...event }));
}