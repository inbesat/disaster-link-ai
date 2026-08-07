"use server";

import { cookies } from "next/headers";
import { SIMULATION_COOKIE } from "@/lib/admin/simulation";

export async function enableSimulationMode() {
  cookies().set(SIMULATION_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h training window
  });
}

export async function disableSimulationMode() {
  cookies().delete(SIMULATION_COOKIE);
}

export async function isSimulationActive() {
  return cookies().get(SIMULATION_COOKIE)?.value === "true";
}