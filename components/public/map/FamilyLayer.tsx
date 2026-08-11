"use client";

// ---------------------------------------------------------------------
// components/public/map/FamilyLayer.tsx — Phase 4 · Step 8 · "Find My
// Family" map layer.
//
// Renders the citizen's family circle (localStorage
// `citizen_family_contacts`, saved during Phase 1 onboarding) as circular
// avatar markers on the map, each with a small safety-status dot on the
// corner: green = Safe, amber = Unknown, pulsing red = In Danger (same
// three-state model as the FamilyStrip on the dashboard).
//
// Family members have no real GPS in the demo, so positions come from
// withFamilyLocations() (lib/map/citizen-family-locations.ts) — a
// deterministic mock spread around the citizen's saved location.
//
// Tapping a member opens a tiny modal with two actions: 📞 Call (tel:)
// and ✉️ Message (sms:). The modal portals to <body> (never trapped in
// the map's positioning context, same as the shelter sheet) and follows
// the roadmap dialog conventions: Escape / backdrop / X to close, focus
// moved into the panel.
//
// The layer is mounted/unmounted by PublicMap's family-layer toggle, so
// hook usage stays unconditional while hidden.
// ---------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Marker } from "react-map-gl/maplibre";
import { MessageSquare, PhoneCall, X } from "lucide-react";
import {
  familyInitials,
  readFamilyContacts,
  type FamilyContactStatus,
  type FamilyContactWithStatus,
} from "@/lib/mock-data/family-contacts";
import {
  withFamilyLocations,
  type FamilyMemberWithLocation,
} from "@/lib/map/citizen-family-locations";

// getServerSnapshot must be a stable reference (see FamilyStrip).
const EMPTY_SNAPSHOT: FamilyContactWithStatus[] = [];

const STATUS_DOT: Record<FamilyContactStatus, { dot: string; label: string; pulse?: boolean }> = {
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

type FamilyLayerProps = {
  /** Citizen's saved location — the center of the family circle. */
  origin: { lat: number; lng: number };
};

export default function FamilyLayer({ origin }: FamilyLayerProps) {
  // Hydration-safe read, same as FamilyStrip: server snapshot is [], the
  // real members swap in after hydration.
  const contacts = useSyncExternalStore(
    subscribe,
    () => readFamilyContacts(),
    () => EMPTY_SNAPSHOT,
  );

  const members = useMemo(
    () => withFamilyLocations(contacts, origin.lat, origin.lng),
    [contacts, origin],
  );

  const [selected, setSelected] = useState<FamilyMemberWithLocation | null>(null);

  if (members.length === 0) return null;

  return (
    <>
      {members.map((member) => (
        <FamilyAvatarMarker
          key={member.phone}
          member={member}
          isSelected={member.phone === selected?.phone}
          onTap={() => setSelected(member)}
        />
      ))}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {selected && (
              <FamilyContactModal
                key={selected.phone}
                member={selected}
                onClose={() => setSelected(null)}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

type FamilyAvatarMarkerProps = {
  member: FamilyMemberWithLocation;
  isSelected: boolean;
  onTap: () => void;
};

function FamilyAvatarMarker({ member, isSelected, onTap }: FamilyAvatarMarkerProps) {
  const status = STATUS_DOT[member.status];

  return (
    <Marker
      longitude={member.lng}
      latitude={member.lat}
      anchor="center"
      style={{ zIndex: isSelected ? 10 : undefined }}
    >
      <button
        type="button"
        onClick={onTap}
        aria-label={`${member.name} — ${status.label}. Open contact options`}
        aria-pressed={isSelected}
        className={`relative block rounded-full transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
          isSelected ? "scale-110" : "hover:scale-105"
        }`}
      >
        {/* Circular avatar with initials — no photos in the demo */}
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-[0.8125rem] font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.45)] backdrop-blur-sm ${
            isSelected
              ? "border-[var(--dl-orange)] bg-[var(--dl-navy-2)] ring-2 ring-[var(--dl-orange)]/40"
              : "border-white/30 bg-gradient-to-br from-[var(--dl-navy-3)] to-[var(--dl-navy-1)]"
          }`}
        >
          {familyInitials(member.name)}
        </span>
        {/* Safety-status dot on the corner */}
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-[var(--dl-navy)] ${status.dot} ${
            status.pulse ? "animate-pulse" : ""
          }`}
        />
      </button>
    </Marker>
  );
}

type FamilyContactModalProps = {
  member: FamilyMemberWithLocation;
  onClose: () => void;
};

function FamilyContactModal({ member, onClose }: FamilyContactModalProps) {
  const status = STATUS_DOT[member.status];
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus into the modal on open; restore focus to the trigger on close.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previouslyFocusedRef.current?.focus?.();
  }, []);

  // Escape closes the modal regardless of where focus is.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop — tap to dismiss */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] bg-black/60"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Contact ${member.name}`}
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="fixed inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[70] mx-auto w-auto max-w-sm rounded-2xl border border-white/10 bg-[var(--dl-navy-2)] p-5 shadow-[var(--dl-shadow-soft)] outline-none sm:inset-x-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[var(--dl-navy-3)] to-[var(--dl-navy)] text-sm font-bold text-white">
              {familyInitials(member.name)}
              <span
                aria-hidden="true"
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[var(--dl-navy)] ${status.dot} ${
                  status.pulse ? "animate-pulse" : ""
                }`}
              />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">{member.name}</h2>
              <p className="text-xs text-[var(--dl-text-muted)]">
                {status.label} · {member.phone.replace("+91", "+91 ")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact options"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {/* Call / Message actions */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <a
            href={`tel:${member.phone}`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--dl-orange)] text-sm font-bold text-white shadow-[0_6px_18px_rgba(249,115,22,0.35)] transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
          >
            <PhoneCall aria-hidden="true" className="h-4 w-4" />
            Call
          </a>
          <a
            href={`sms:${member.phone}`}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white transition hover:border-[var(--dl-orange)]/50 hover:bg-[var(--dl-orange)]/10 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
          >
            <MessageSquare aria-hidden="true" className="h-4 w-4" />
            Message
          </a>
        </div>
      </motion.div>
    </>
  );
}
