import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsSidebar from "@/components/settings/SettingsSidebar";
import SettingsSearchHost from "@/components/settings/SettingsSearchHost";

// ---------------------------------------------------------------------
// app/(app)/settings/layout.tsx — Settings module master layout (Phase 1).
//
// Guards the whole /settings tree like the dashboard layout (guests pass
// through for demo continuity; authenticated users must have a completed
// profile). Renders the SettingsSidebar shell plus the module header:
// "Command Center Configuration — Personalize your responder profile and
// system preferences."
// ---------------------------------------------------------------------

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const guest = cookies().get("guest_mode")?.value === "true";

  if (!guest) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?next=/settings/profile");
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile?.role) {
      redirect("/profile-setup");
    }
  }

  return (
    <SettingsSidebar>
      {/* Sticky search — Cmd/Ctrl+K · filters cards + jumps to sections */}
      <div className="sticky top-0 z-30 -mx-1 mb-6 border-b border-[#1c2740] bg-[#0a0f1d]/90 px-1 py-3 backdrop-blur">
        <SettingsSearchHost />
      </div>
      {/* Module header — sits above the page content, below the sticky bar. */}
      <header className="mb-6 border-b border-[#1c2740] pb-5">
        <p className="eoc-label text-cyan-400/90">SETTINGS / CONFIGURATION</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Command Center Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Personalize your responder profile and system preferences.
        </p>
      </header>

      {children}
    </SettingsSidebar>
  );
}
