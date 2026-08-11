"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  MapPinned,
  ListChecks,
  ScrollText,
  Activity,
  BarChart3,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import BackButton from "@/components/ui/BackButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "User Management", icon: Users },
  { href: "/districts", label: "District Config", icon: MapPinned },
  { href: "/bulk-ops", label: "Bulk Operations", icon: ListChecks },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/health", label: "System Health", icon: Activity },
] as const;

function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <div className="flex h-14 items-center justify-between gap-2.5 border-b border-[#1c2740] px-5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-amber-400" />
          <span className="eoc-label text-amber-400/90">DRIP / ADMIN</span>
        </div>
        <BackButton />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-amber-500/10 text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.25)]"
                  : "text-slate-400 hover:bg-[#1a2338] hover:text-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1c2740] px-5 py-4">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-slate-500">
          Super Admin
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Full system control · restricted access
        </p>
      </div>
    </>
  );
}

export default function AdminSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070b13] text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#1c2740] bg-[#0b1120] lg:flex">
        <SidebarContent />
      </aside>

      {/* Distinguant elevated top header — darker/stricter than the main app */}
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between gap-3 border-b border-[#1c2740] bg-[#020617] px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {!open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-md border border-[#1c2740] bg-[#0b1120] px-2.5 py-1.5 text-sm font-medium text-amber-300 transition hover:bg-[#1a2338] lg:hidden"
              aria-label="Open admin navigation"
            >
              <Menu className="h-4 w-4" />
              Admin menu
            </button>
          )}
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
            <ShieldCheck className="h-4 w-4 text-amber-400" aria-hidden />
            <span className="hidden sm:inline">DRIP / Admin Console</span>
            <span className="sm:hidden">Admin</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1 rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-widest text-red-400 sm:inline-flex">
            Elevated Access
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#1c2740] bg-[#0b1120] px-2.5 py-1 font-mono text-[0.625rem] text-slate-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            LIVE
          </span>
          <BackButton />
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[#1c2740] bg-[#0b1120]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-slate-400 transition hover:bg-[#1a2338] hover:text-slate-200"
              aria-label="Close admin navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
