import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Demo cookie-only admin session (govLogin writes `role` without creating
  // a Supabase user) — admit district_admin/super_admin straight from the
  // cookie so they aren't bounced to /login after middleware lets them in.
  const roleCookie = await cookies().get("role")?.value;
  const validCookieSession =
    roleCookie === "super_admin" || roleCookie === "district_admin";

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let allowed = validCookieSession;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    allowed =
      profile?.role === "super_admin" || profile?.role === "district_admin";
  }

  if (!allowed) {
    // Real Supabase users with a known identity get the explicit 403; anyone
    // else (path via roleCookie too) — back to login.
    redirect(user ? "/403" : "/login?next=/dashboard");
  }

  return <AdminSidebar>{children}</AdminSidebar>;
}