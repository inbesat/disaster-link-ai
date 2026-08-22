"use client";

// ---------------------------------------------------------------------
// components/public/FamilyStrip.tsx — Phase 2 · Step 6 · Family Safety
// Status Strip.
//
// A horizontal scroll of the citizen's family circle (from localStorage
// `citizen_family_contacts`, saved during Phase 1 onboarding): circular
// avatars with initials (no photos in the demo), each carrying a colored
// status dot — Safe (green) / Unknown (amber) / In Danger (pulsing red).
//
// Tapping an avatar opens a small modal to either nudge that member for
// an update or broadcast "I am Safe" to them. The modal follows the
// roadmap dialog conventions (framer-motion spring sheet + backdrop,
// Esc / backdrop / X to close, focus moved into the panel) used by
// ShortcutModal / BiometricPrompt, in the citizen dl-* design language.
//
// Statuses are mock (see lib/mock-data/family-contacts.ts) — swap in
// realtime presence later without touching this component.
// ---------------------------------------------------------------------

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Check, PhoneCall, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { showToast } from "@/components/ui/Toast";
import {
  familyInitials,
  readFamilyContacts,
  type FamilyContactStatus,
  type FamilyContactWithStatus,
} from "@/lib/mock-data/family-contacts";

// getServerSnapshot must return a cached reference — a fresh [] literal on
// every call trips React's "getServerSnapshot should be cached to avoid an
// infinite loop" hydration warning.
const EMPTY_SNAPSHOT: FamilyContactWithStatus[] = [];

const STATUS_DOT: Record<
  FamilyContactStatus,
  { dot: string; label: string; pulse?: boolean }
> = {
  safe: { dot: "bg-severity-green-500", label: "Safe" },
  unknown: { dot: "bg-severity-amber-500", label: "Unknown" },
  danger: { dot: "bg-severity-red-500", label: "In danger", pulse: true },
};

/** Subscribe to cross-tab family-circle changes (storage events). */
function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === "citizen_family_contacts") onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

export function FamilyStrip() {
  // Hydration-safe read: server snapshot is always [] (no localStorage on
  // the server), so SSR and first client paint agree; React swaps in the
  // real members right after hydration — same pattern as useSafetyStatus.
  const members = useSyncExternalStore(
    subscribe,
    () => readFamilyContacts(),
    () => EMPTY_SNAPSHOT,
  );
  const [selected, setSelected] = useState<FamilyContactWithStatus | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  // Remember where focus was before opening, so closing returns it.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus into the modal on open; restore focus to the trigger on close.
  useEffect(() => {
    if (selected) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [selected]);

  // Escape closes the modal regardless of where focus is (window listener).
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  if (members.length === 0) {
    return (
      <section
        aria-label="Family safety"
        className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      >
        <p className="text-sm text-slate-400">
          No family members yet —{" "}            <Link
              href="/public/setup/family"
              className="font-semibold text-blue-400 hover:underline"
            >
              add your safety circle
            </Link>{" "}
          for one-tap SOS blasts.
        </p>
      </section>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <section aria-label="Family safety status" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="eoc-label text-slate-400">MY FAMILY</p>
          <p className="text-xs text-slate-500">
            Tap a member to reach them
          </p>
        </div>

        {/* Horizontal avatar scroll — hide scrollbars, snap-friendly */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {members.map((member) => {
            const dot = STATUS_DOT[member.status];
            return (
              <button
                key={member.phone}
                type="button"
                onClick={() => setSelected(member)}
                aria-label={`${member.name} — status ${dot.label}. Open contact options`}
                className="group flex w-20 shrink-0 flex-col items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {/* Avatar + status dot */}
                <span className="relative">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-slate-700 to-slate-800 text-sm font-bold text-white shadow-lg transition group-hover:border-blue-500/50 group-hover:ring-2 group-hover:ring-blue-500/30 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    {familyInitials(member.name)}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[#0a0f1a] ${dot.dot} ${
                      dot.pulse ? "animate-pulse" : ""
                    }`}
                  />
                </span>
                <span className="w-full truncate text-center text-xs font-medium text-slate-300">
                  {member.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Nudge / broadcast modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Contact ${selected.name}`}
              tabIndex={-1}
              initial={{ y: 32, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 32, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-800 p-5 shadow-2xl outline-none"
            >
              {/* Header — avatar + name */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[var(--dl-navy-3)] to-[var(--dl-navy)] text-sm font-bold text-white">
                    {familyInitials(selected.name)}
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-white">{selected.name}</h2>
                    <p className="text-xs text-[var(--dl-text-muted)]">
                      {STATUS_DOT[selected.status].label} ·{" "}
                      {selected.phone.replace("+91", "+91 ")}
                    </p>
                  </div>
                </div>
                <IconButton
                  label="Close contact options"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(null)}
                >
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>

              {/* Actions */}
              <div className="mt-5 space-y-2.5">
                <NudgeButton
                  onClick={() => {
                    showToast("info", {
                      title: `Nudge sent`,
                      description: `${selected.name} has been asked for an update.`,
                    });
                    setSelected(null);
                  }}
                >
                  <PhoneCall className="h-4 w-4" aria-hidden />
                  Nudge {selected.name.split(" ")[0]} for an update
                </NudgeButton>
                <NudgeButton
                  onClick={() => {
                    showToast("success", {
                      title: `"I am Safe" sent`,
                      description: `${selected.name} knows you're safe.`,
                    });
                    setSelected(null);
                  }}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Broadcast &quot;I am Safe&quot; to {selected.name.split(" ")[0]}
                </NudgeButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

/** Shared modal action button — children carry the icon + label. */
function NudgeButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
    >
      {children}
    </button>
  );
}

export default FamilyStrip;
