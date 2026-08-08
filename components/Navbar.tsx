import Link from "next/link";
import { Settings } from "lucide-react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { clearGuestMode, signOutAction } from "@/app/actions/auth";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import PushNotificationToggle from "@/components/dashboard/PushNotificationToggle";
import PresenceIndicators from "@/components/dashboard/PresenceIndicators";
import SyncStatus from "@/components/dashboard/SyncStatus";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/ui/LanguageSelector";
import NavbarMobileMenu from "@/components/NavbarMobileMenu";
import NavbarNav from "@/components/NavbarNav";
import NavbarAvatar from "@/components/NavbarAvatar";
import BackButton from "@/components/ui/BackButton";
import Translated from "@/components/ui/Translated";

export default async function Navbar() {
  const guest = cookies().get("guest_mode")?.value === "true";

  let name: string | null = null;
  let email: string | null = null;
  let avatarUrl: string | null = null;

  if (!guest) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const meta = user.user_metadata ?? {};
      name = (meta.name as string) || (meta.full_name as string) || null;
      email = user.email ?? null;
      avatarUrl = (meta.avatar_url as string) || null;
    }
  }

  const displayName = guest ? "Guest Commander" : (name ?? email ?? "Responder");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-2">
          <BackButton />
          {/* Phase 25 · Step 5 — translated brand + links (client component) */}
          <NavbarNav />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {guest ? (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 bg-surface-elevated text-accent"
                aria-hidden="true"
              >
                <GuestAvatarIcon />
              </span>
            ) : (
              /* Phase 3 · avatar reads the local snapshot first for instant
                 updates after an offline save, then the server URL, then
                 initials. */
              <NavbarAvatar serverAvatarUrl={avatarUrl} displayName={displayName} />
            )}

            <span className="text-left leading-tight">
              <span className="block text-sm font-semibold text-foreground">
                {displayName}
              </span>
              {guest ? (
                <span className="block text-[11px] font-medium uppercase tracking-wider text-accent">
                  Demo mode
                </span>
              ) : (
                <span className="block text-[11px] text-slate-400">{email}</span>
              )}
            </span>
          </div>

          <div className="hidden lg:block">
            <SyncStatus />
          </div>
          <PresenceIndicators />
          <NotificationCenter />
          <div className="hidden md:block">
            <PushNotificationToggle />
          </div>

          {/* Settings module entry point (Phase 1 · Settings shell) */}
          <Link
            href="/settings/profile"
            aria-label="Open settings"
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-elevated text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            <Settings className="h-4 w-4" aria-hidden />
          </Link>

          {/* Phase 25 · Step 4 — multilingual selector (23 languages) */}
          <LanguageSelector />

          <ThemeToggle />

          {/* Phase 22 · Step 10 — mobile hamburger + blurred menu */}
          <NavbarMobileMenu />

          <form
            action={guest ? clearGuestMode : signOutAction}
            className="ml-1 border-l border-border pl-4"
          >
            <button
              type="submit"
              className="rounded-md border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              <Translated k={guest ? "exit_demo" : "sign_out"} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function GuestAvatarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
