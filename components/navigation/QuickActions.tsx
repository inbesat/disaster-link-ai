// ---------------------------------------------------------------------
// components/navigation/QuickActions.tsx
// UI/UX Phase 2 · Step 8 — emergency quick-action panel.
//
// Floating (in-shell) panel that sits above the collapse footer in the
// sidebar — one-click shortcuts for the highest-priority emergency tasks.
// Only visible while the sidebar is expanded (self-hides at the 64px rail
// via the shared sidebar context), subtle --bg-tertiary surface with soft
// rounded corners, and two high-contrast accent buttons that confirm
// their dispatch with the roadmap toast card.
//
// Icons are Lucide (Siren / Zap) to match the design system — no emoji.
// ---------------------------------------------------------------------

"use client";

import { Siren, Zap } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import useToast from "@/hooks/useToast";

export function QuickActions() {
  const { collapsed } = useSidebar();
  const toast = useToast();

  // Only meaningful in the expanded sidebar — hide entirely in the
  // 64px icon rail (the collapse toggle + tooltips already cover that).
  if (collapsed) return null;

  return (
    <div className="mx-2 mb-1 rounded-lg border border-subtle bg-tertiary p-2">
      <p className="px-1 pb-2 text-[0.625rem] font-semibold uppercase tracking-wider text-muted">
        Quick actions
      </p>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() =>
            toast.warning({
              title: "Emergency alert queued",
              description: "Broadcast dispatched to the EOC for review.",
            })
          }
          className="flex h-9 w-full items-center gap-2 rounded-md bg-accent-danger/15 px-3 text-sm font-semibold text-accent-danger transition-colors duration-150 hover:bg-accent-danger/25 motion-reduce:transition-none"
        >
          <Siren className="h-4 w-4 shrink-0" aria-hidden />
          Send Alert
        </button>
        <button
          type="button"
          onClick={() =>
            toast.info({
              title: "Run AI Plan",
              description: "Planner started — generating response plan.",
            })
          }
          className="flex h-9 w-full items-center gap-2 rounded-md bg-accent-primary/15 px-3 text-sm font-semibold text-accent-primary transition-colors duration-150 hover:bg-accent-primary/25 motion-reduce:transition-none"
        >
          <Zap className="h-4 w-4 shrink-0" aria-hidden />
          Run AI Plan
        </button>
      </div>
    </div>
  );
}

export default QuickActions;
