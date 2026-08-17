"use client";

// ---------------------------------------------------------------------
// components/map/InfoDrawer.tsx — UI/UX Phase 5 · Step 4.
//
// Contextual info panel for a tapped map feature. Responsive by design:
//   • Desktop (md+) — slides in from the left as a floating sidebar just
//     under the map header.
//   • Mobile — slides UP as a bottom sheet from the bottom edge.
// Controlled entirely by `feature` (null → closed). framer-motion drives
// the enter/exit slide in both breakpoint variants.
// ---------------------------------------------------------------------

import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Pencil, Phone, X } from "lucide-react";

export type InfoFeature = {
  /** Primary heading, e.g. "Patna Central Shelter". */
  title: string;
  /** Occupied capacity readout, e.g. "450". */
  capacityUsed: number;
  /** Total capacity readout, e.g. "500". */
  capacityTotal: number;
  /** Operational status, e.g. "Open". */
  status: string;
  /** Optional subtitle, e.g. the shelter zone. */
  subtitle?: string;
};

type InfoDrawerProps = {
  /** Selected map feature — null hides the drawer. */
  feature: InfoFeature | null;
  /** Fired by the (X) close button. */
  onClose: () => void;
};

function DrawerContent({
  feature,
  onClose,
}: {
  feature: InfoFeature;
  onClose: () => void;
}) {
  const pct = Math.round((feature.capacityUsed / feature.capacityTotal) * 100);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close info panel"
        className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted transition hover:border-accent hover:text-accent"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>

      <h3 className="pr-8 text-base font-bold text-primary">{feature.title}</h3>
      {feature.subtitle && (
        <p className="mt-0.5 text-xs text-muted">{feature.subtitle}</p>
      )}

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-md border border-border bg-surface-elevated p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">Capacity</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-primary">
            {feature.capacityUsed}/{feature.capacityTotal}
          </p>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-tertiary"
            aria-hidden
          >
            <div
              className={`h-full rounded-full ${pct >= 90 ? "bg-accent-danger" : pct >= 70 ? "bg-accent-warning" : "bg-accent-success"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="rounded-md border border-border bg-surface-elevated p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted">Status</p>
          <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-accent-success">
            <span className="h-2 w-2 rounded-full bg-accent-success" aria-hidden />
            {feature.status}
          </p>
        </div>
      </div>

      {/* Action row */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md bg-accent-primary px-3 text-sm font-semibold text-white shadow-glow-blue transition hover:opacity-90 hover:shadow-none"
        >
          <MapPin className="h-4 w-4" aria-hidden />
          Navigate
        </button>
        <button
          type="button"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 text-sm font-medium text-slate-200 transition hover:border-accent hover:text-accent"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Edit
        </button>
        <button
          type="button"
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-surface-elevated px-3 text-sm font-medium text-slate-200 transition hover:border-accent hover:text-accent"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Contact
        </button>
      </div>
    </div>
  );
}

export function InfoDrawer({ feature, onClose }: InfoDrawerProps) {
  return (
    <AnimatePresence>
      {feature && (
        <>
          {/* Desktop — floating left sidebar under the header */}
          <motion.aside
            key="drawer-desktop"
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed left-3 top-[64px] z-20 hidden w-80 md:block"
          >
            <div className="max-h-[calc(100dvh-96px)] overflow-y-auto rounded-lg border border-border bg-secondary/95 p-4 shadow-card backdrop-blur">
              <DrawerContent feature={feature} onClose={onClose} />
            </div>
          </motion.aside>

          {/* Mobile — bottom sheet sliding up from the bottom edge */}
          <motion.div
            key="drawer-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 md:hidden"
          >
            <div className="mx-3 mb-3 rounded-t-2xl rounded-b-lg border border-border bg-secondary/95 p-4 pb-8 shadow-2xl backdrop-blur">
              <span
                className="mx-auto mb-3 block h-1 w-12 rounded-full bg-slate-500"
                aria-hidden
              />
              <DrawerContent feature={feature} onClose={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default InfoDrawer;
