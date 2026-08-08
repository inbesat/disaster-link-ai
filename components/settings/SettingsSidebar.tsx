"use client";

// ---------------------------------------------------------------------
// components/settings/SettingsSidebar.tsx — Settings module shell (Phase 1).
//
// Master 2-column layout for /settings:
//   • Desktop: fixed 256px sidebar (lg+) with the 8 settings sections.
//   • Mobile:  top bar + collapsible drawer (w-72), backdrop-blurred.
//   • Active  tab gets a cyan left border + tint; admin-only sections are
//     amber-tinted and carry an "ADMIN" badge.
// Mirrors the AdminSidebar pattern so the two consoles feel identical.
// ---------------------------------------------------------------------

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Building2,
  Cable,
  Lock,
  Map,
  Menu,
  PhoneCall,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";

type NavItem = {
  href: string;
  label: string;
  icon: typeof UserRound;
  admin?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/settings/profile", label: "Profile & Account", icon: UserRound },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/map", label: "Map & Display", icon: Map },
  { href: "/settings/ai", label: "AI Assistant", icon: Sparkles },
  {
    href: "/settings/organization",
    label: "Organization (Admin)",
    icon: Building2,
    admin: true,
  },
  { href: "/settings/privacy", label: "Privacy & Security", icon: Lock },
  { href: "/settings/contacts", label: "Emergency Contacts", icon: PhoneCall },
  { href: "/settings/integrations", label: "Integrations (Admin)", icon: Cable, admin: true },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-14 items-center justify-between gap-2.5 border-b border-[#1c2740] px-5">
        <div className="flex items-center gap-2.5">
          <Settings className="h-4 w-4 text-cyan-400" />
          <span className="eoc-label text-cyan-400/90">DRIP / SETTINGS</span>
        </div>
        <BackButton />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, admin }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-cyan-500/10 text-cyan-300"
                  : "text-slate-400 hover:bg-[#1a2338] hover:text-slate-200"
              }`}
            >
              {/* Active-tab accent: cyan border on the left + soft glow. */}
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              )}
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  admin && !active ? "text-amber-400/80 group-hover:text-amber-300" : ""
                }`}
              />
              <span className="flex-1 truncate">{label}</span>
              {admin && (
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    active
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-[#1c2740] text-slate-500 group-hover:text-amber-400/70"
                  }`}
                >
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1c2740] px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Command Center
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Personal preferences sync to your responder profile.
        </p>
      </div>
    </>
  );
}

export default function SettingsSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#1c2740] bg-[#0a0f1d] lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#1c2740] bg-[#0a0f1d] px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md bg-[#1a2740] px-3 py-2 text-sm font-medium text-cyan-300 transition hover:bg-[#24334f]"
          aria-label="Open settings navigation"
        >
          <Menu className="h-4 w-4" />
          Settings
        </button>
        <div className="flex items-center gap-2">
          <BackButton />
          <span className="eoc-label text-cyan-400/90">DRIP / SETTINGS</span>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[#1c2740] bg-[#0a0f1d]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 transition hover:bg-[#1a2748] hover:text-slate-200"
              aria-label="Close settings navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content — pushed right on desktop */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
