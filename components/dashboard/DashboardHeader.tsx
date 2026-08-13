"use client";

// ---------------------------------------------------------------------
// components/dashboard/DashboardHeader.tsx
// UI/UX Phase 4 · Step 1 — Command Center dashboard header (56px).
//
// Sticky top bar that frames every dashboard screen:
//   • Left   — District selector (Patna / Ernakulam / Purba Champaran)
//   • Center — Live IST clock (ticking every second via LiveClock,
//              Phase 10 · Step 2)
//   • Right  — Global flood status badge, notification bell, avatar + role
//              chip.
//
// All colors follow the hero-screen spec exactly (bg-[#0a0f1a]/95 + white/10
// hairline) so the header reads as one dark slab independent of theme tokens.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import SeverityBadge from "@/components/ui/SeverityBadge";
import NavbarAvatar from "@/components/NavbarAvatar";
import NotificationCenter from "@/components/dashboard/NotificationCenter";
import LiveClock from "@/components/dashboard/LiveClock";
import LanguageTranslator from "@/components/ui/LanguageTranslator";

/** Districts the Command Center can switch between (mirrors DEFAULT_DISTRICTS). */
export const DASHBOARD_DISTRICTS = ["Patna", "Ernakulam", "Purba Champaran"] as const;

type DashboardHeaderProps = {
  /** Currently selected district, e.g. "Patna". */
  currentDistrict: string;
  /** Fired when the user picks a district from the dropdown. */
  onDistrictChange: (district: string) => void;
  /** Global flood status level passed to <SeverityBadge>. */
  floodSeverity?: string;
  /** Role chip label under the avatar, e.g. "Super Admin". */
  roleLabel?: string;
  /** Display name rendered next to the avatar. */
  displayName?: string;
  /** Server-provided avatar URL (client falls back to local snapshot). */
  avatarUrl?: string | null;
};

/**
 * Accessible district dropdown — button + floating listbox with outside-click
 * and Escape handling. Closes on selection.
 */
function DistrictSelect({
  currentDistrict,
  onDistrictChange,
}: {
  currentDistrict: string;
  onDistrictChange: (district: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm font-semibold text-slate-100 transition ${
          open
            ? "border-white/25 bg-white/10"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        }`}
      >
        <MapPin className="h-4 w-4 text-accent" aria-hidden />
        <span className="max-w-[150px] truncate">{currentDistrict}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select district"
          className="absolute left-0 top-full z-50 mt-2 w-52 rounded-md border border-white/10 bg-[#111827] p-1 shadow-xl shadow-black/40"
        >
          {DASHBOARD_DISTRICTS.map((district) => {
            const active = district === currentDistrict;
            return (
              <li key={district} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm transition ${
                    active
                      ? "bg-accent/15 font-semibold text-accent"
                      : "text-slate-200 hover:bg-white/5"
                  }`}
                  onClick={() => {
                    onDistrictChange(district);
                    setOpen(false);
                  }}
                >
                  {active && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  )}
                  <span className="truncate">{district}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DashboardHeader({
  currentDistrict,
  onDistrictChange,
  floodSeverity = "critical",
  roleLabel = "Super Admin",
  displayName = "Command Center",
  avatarUrl = null,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0a0f1a]/95 px-4 backdrop-blur-md">
      {/* Left — district selector */}
      <DistrictSelect
        currentDistrict={currentDistrict}
        onDistrictChange={onDistrictChange}
      />

      {/* Middle — live IST clock (true center on md+), Phase 10 · Step 2 */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 md:flex"
        aria-live="off"
      >
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-accent-success"
          aria-hidden
        />
        <LiveClock />
      </div>

        {/* Right — flood badge, Google Translate, notification bell,
            avatar + role chip */}
        <div className="ml-auto flex items-center gap-2.5">
          <LanguageTranslator />

          <span className="hidden sm:block">
          <SeverityBadge variant={floodSeverity} size="sm" />
        </span>
        {/* Icon-only badge on the smallest screens so it never truncates */}
        <span className="sm:hidden">
          <SeverityBadge variant={floodSeverity} size="sm" label="" />
        </span>

        <NotificationCenter />

        <span className="hidden h-6 w-px bg-white/10 sm:block" />

        <div className="flex items-center gap-2">
          <NavbarAvatar serverAvatarUrl={avatarUrl} displayName={displayName} />
          <div className="hidden flex-col items-start sm:flex">
            <span className="max-w-[150px] truncate text-sm font-semibold leading-tight text-slate-100">
              {displayName}
            </span>
            <span className="rounded-sm border border-accent/30 bg-accent/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-accent">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
