import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/lib/validations/user";
import Navbar from "@/components/Navbar";
import AlertTicker from "@/components/dashboard/AlertTicker";

const OPERATIONAL_ROLES: Role[] = ROLES.filter((role) => role !== "viewer");

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const guest = cookies().get("guest_mode")?.value === "true";

  if (guest) {
    return (
      <>
        <Navbar />
        <AlertTicker />
        {children}
      </>
    );
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/command-center");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    redirect("/profile-setup");
  }

  if (!OPERATIONAL_ROLES.includes(profile.role as (typeof ROLES)[number])) {
    redirect("/403");
  }

  return (
    <>
      <Navbar />
      <AlertTicker />
      {children}
    </>
  );
}
