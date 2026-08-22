"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import ProfileMenu, {
  type PublicIdentity,
} from "@/components/public/ProfileMenu";
import Translated from "@/components/ui/Translated";

export default function PublicNavbar() {
  const identity: PublicIdentity = { mode: "guest" };
  const statusLabel = "GUEST MODE";

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-red-500" />
        <Translated k="citizen_portal" className="text-sm font-bold tracking-tight text-white" />
      </div>
      <div className="flex items-center gap-2">
        <span className="eoc-label hidden text-[var(--dl-text-muted)] sm:block">
          {statusLabel}
        </span>
        {/* Phase 13 · Step 2 — settings (low-bandwidth toggle lives there) */}
        <Link
          href="/public/settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--dl-text-muted)] transition hover:border-[var(--dl-orange)]/60 hover:text-white"
        >
          <Settings aria-hidden="true" className="h-4 w-4" />
        </Link>
        <Link
          href="/"
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium transition hover:border-[var(--dl-blue)]/60 hover:text-white"
        >
          <Translated k="nav_home" />
        </Link>
        <ProfileMenu identity={identity} />
      </div>
    </header>
  );
}