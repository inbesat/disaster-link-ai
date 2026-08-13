"use server";

import { cookies } from "next/headers";
import { SIMULATION_COOKIE } from "@/lib/admin/simulation";
import { requireRole } from "@/lib/security/require-role";

const ADMIN_ROLES = ["super_admin", "district_admin"] as const;

export async function enableSimulationMode() {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");

  cookies().set(SIMULATION_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h training window
  });
}

export async function disableSimulationMode() {
  const auth = await requireRole(ADMIN_ROLES);
  if (!auth.ok) throw new Error("Unauthorized: admin access required.");

  cookies().delete(SIMULATION_COOKIE);
}

export async function isSimulationActive() {
  return cookies().get(SIMULATION_COOKIE)?.value === "true";
}
