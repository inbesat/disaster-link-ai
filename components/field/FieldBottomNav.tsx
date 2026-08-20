"use client";

// ---------------------------------------------------------------------
// components/field/FieldBottomNav.tsx — Phase 14 · Step 1 + Step 7.
//
// Sticky 5-item responder bottom nav: Tasks (active), Map, Team, Chat and
// a raised 64px red SOS button. Replaces the older quick-action bar —
// the four quick actions it used to expose (Shelter Full, Road Blocked,
// Request Aid, SOS Panic) are superseded by the QuickStatusGrid on the
// Tasks page, while the SOS slot now opens the slide-to-trigger
// ResponderSOS flow (Step 7).
//
// Touch conventions:
//   • min 48px targets, safe-area bottom padding for iOS home indicator
//   • the active tab is read from usePathname (Tasks = "/field" exactly)
//   • every tab tap buzzes a light haptic so the hardware feels alive
// ---------------------------------------------------------------------

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListTodo, Map as MapIcon, Users, MessageSquare } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import ResponderSOS from "@/components/field/ResponderSOS";

const TABS = [
  { href: "/field", label: "Tasks", icon: ListTodo },
  { href: "/field/map", label: "Map", icon: MapIcon },
  { href: "/field/team", label: "Team", icon: Users },
  { href: "/field/chat", label: "Chat", icon: MessageSquare },
] as const;

export default function FieldBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Responder navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-cyan-400/40 bg-[#0A0F1D] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-5">
        {/* Four navigation tabs */}
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/field" ? pathname === "/field" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={triggerLightHaptic}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[68px] flex-col items-center justify-center gap-1 py-2 transition active:scale-95 ${
                active
                  ? "text-cyan-300"
                  : "border-t border-panel-border text-slate-400 active:bg-white/5"
              }`}
            >
              <Icon className="h-7 w-7" aria-hidden />
              <span
                className={`text-[0.8125rem] font-bold leading-tight ${
                  active ? "text-cyan-300" : ""
                }`}
              >
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1 h-1 w-8 rounded-full bg-cyan-400/80" />
              )}
            </Link>
          );
        })}

        {/* Step 7 — raised 64px SOS button */}
        <ResponderSOS />
      </div>
    </nav>
  );
}
