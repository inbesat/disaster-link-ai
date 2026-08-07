"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const GUEST_COOKIE = "guest_mode";

export async function signOutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  cookies().delete(GUEST_COOKIE);
  redirect("/login");
}

// Bypass auth to demo the dashboard without a real Supabase login.
// Only used for testing — the guest is not an authenticated user.
// Always lands on /command-center: the middleware treats guests as fully
// authenticated, so the demo panel opens with no profile/session checks.
export async function setGuestMode() {
  cookies().set(GUEST_COOKIE, "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/command-center");
}

export async function clearGuestMode() {
  cookies().delete(GUEST_COOKIE);
  redirect("/login");
}
