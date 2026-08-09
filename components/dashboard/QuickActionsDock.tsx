"use client";

// ---------------------------------------------------------------------
// components/dashboard/QuickActionsDock.tsx — UI/UX Phase 4 · Step 10.
//
// Floating speed-dial of one-click emergency actions, pinned to the
// bottom-right on desktop (hidden on mobile — the bottom nav owns that
// real estate). Each action is an IconButton wrapped in a CSS tooltip that
// appears on hover / focus on the label's left side.
// ---------------------------------------------------------------------

import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, Helicopter, Siren } from "lucide-react";
import IconButton from "@/components/ui/IconButton";

type DockAction = {
  key: string;
  label: string;
  icon: ReactNode;
  variant: "danger" | "floating" | "purple";
  href: string;
};

const DOCK_ACTIONS: DockAction[] = [
  {
    key: "alert",
    label: "Send Alert",
    icon: <Siren className="h-5 w-5" aria-hidden />,
    variant: "danger",
    href: "/alerts",
  },
  {
    key: "dispatch",
    label: "Dispatch Resource",
    icon: <Helicopter className="h-5 w-5" aria-hidden />,
    variant: "floating",
    href: "/dispatch",
  },
  {
    key: "ai",
    label: "Run AI Plan",
    icon: <Bot className="h-5 w-5" aria-hidden />,
    variant: "purple",
    href: "/ai-planner",
  },
];

/** Minimal CSS tooltip — appears left of the button on hover / keyboard focus. */
function DockTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative flex items-center">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-slate-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

export function QuickActionsDock() {
  return (
    <nav
      aria-label="Quick actions"
      className="fixed bottom-6 right-6 z-40 hidden flex-col gap-3 lg:flex"
    >
      {DOCK_ACTIONS.map((action) => (
        <DockTooltip key={action.key} label={action.label}>
          <Link href={action.href} tabIndex={-1}>
            <IconButton label={action.label} size="lg" variant={action.variant}>
              {action.icon}
            </IconButton>
          </Link>
        </DockTooltip>
      ))}
    </nav>
  );
}

export default QuickActionsDock;
