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
      <div className="flex h-14 items-center gap-2.5 border-b border-[#1c2740] px-5">
        <ShieldCheck className="h-4 w-4 text-amber-400" />
        <span className="eoc-label text-amber-400/90">DRIP / ADMIN</span>
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
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#1c2740] bg-[#0b1120] px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-md bg-[#1a2740] px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-[#24334f]"
          aria-label="Open admin navigation"
        >
          <Menu className="h-4 w-4" />
          Admin Menu
        </button>
        <span className="eoc-label text-amber-400/90">DRIP / ADMIN</span>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-[#1c2740] bg-[#0b1120]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 transition hover:bg-[#1a2748] hover:text-slate-200"
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