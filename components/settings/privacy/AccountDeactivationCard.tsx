"use client";

// ---------------------------------------------------------------------
// components/settings/privacy/AccountDeactivationCard.tsx — Privacy (Phase 6 · Step 9).
//
// The Danger Zone — account deactivation & deletion:
//   • Solid-red "Danger Zone" card.
//   • Two radio-button modes — Soft Deactivate (profile hidden, data
//     retained for 30 days) and Permanent Deletion (irreversible).
//   • "Delete Account" opens a strict confirmation modal that requires
//     typing the exact phrase "DELETE MY ACCOUNT" before the final red
//     confirmation button becomes clickable.
//   • Pending requests show a status card with the effective date and a
//     cancel option; completing a request resets the card to the
//     deactivated empty state.
//   • Persists through lib/settings/privacy-settings.ts.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Clock, Trash2 } from "lucide-react";
import type { DeactivationMode } from "@/lib/settings/privacy-settings";

const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

/** Friendly date (e.g. "30 Aug 2026") from an ISO timestamp. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Effective date of the deactivation: soft delete = request time + 30 days
 * (recoverable window), hard delete = immediately.
 */
function effectiveDateLabel(mode: DeactivationMode, effectiveAt: string): string {
  if (mode === "hard") return "immediately";
  const d = new Date(effectiveAt);
  if (Number.isNaN(d.getTime())) return formatDate(effectiveAt);
  d.setDate(d.getDate() + 30);
  return formatDate(d.toISOString());
}

const DANGER_CARD = "rounded-eoc border-2 border-red-600/70 bg-surface p-5 shadow-[0_0_30px_rgba(220,38,38,0.12)]";

export default function AccountDeactivationCard({
  mode,
  effectiveAt,
  onRequest,
  onCancel,
}: {
  mode: DeactivationMode;
  effectiveAt: string | null;
  onRequest: (mode: Exclude<DeactivationMode, null>) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<"soft" | "hard">("soft");
  const [modalOpen, setModalOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

  function closeModal() {
    setModalOpen(false);
    setPhrase("");
  }

  function confirmDeletion() {
    if (phrase !== CONFIRM_PHRASE || deleting) return;
    setDeleting(true);
    // Brief simulated deletion round-trip before the request is recorded.
    setTimeout(() => {
      setDeleting(false);
      closeModal();
      onRequest(selected);
      toast.success(
        selected === "soft"
          ? "Soft deactivation scheduled — profile hidden, data retained for 30 days."
          : "Permanent deletion scheduled — account will be removed.",
        { duration: 3500 },
      );
    }, 900);
  }

  // Pending request already exists → show status instead of the wizard.
  if (mode && effectiveAt) {
    return (
      <section
        data-settings-key="privacy-account-deactivation"
        className={DANGER_CARD}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
            <Clock className="h-5 w-5 text-red-400" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-red-400/90">DANGER ZONE · REQUEST PENDING</p>
            <h2 className="mt-0.5 text-lg font-bold text-red-300">Danger Zone</h2>
          </div>
        </div>

        <div className="mt-5 rounded-md border border-red-500/40 bg-red-500/[0.06] p-4">
          <p className="text-sm font-bold text-red-300">
            {mode === "soft"
              ? "Soft deactivation scheduled"
              : "Hard deletion scheduled"}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {mode === "soft"
              ? `Your account is marked for soft deletion and becomes unrecoverable after ${effectiveDateLabel(mode, effectiveAt)}. Data is retained for 30 days for recovery.`
              : `Your account will be permanently and irreversibly deleted ${effectiveDateLabel(mode, effectiveAt)}.`}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onCancel();
              toast("Deactivation request cancelled — account restored.", {
                duration: 3000,
              });
            }}
            className="rounded-md border border-emerald-400/60 bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/25"
          >
            Cancel request
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        data-settings-key="privacy-account-deactivation"
        className={DANGER_CARD}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden />
          </div>
          <div>
            <p className="eoc-label text-red-400/90">DANGER ZONE · IRREVERSIBLE ACTIONS</p>
            <h2 className="mt-0.5 text-lg font-bold text-red-300">Danger Zone</h2>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          Deactivate or permanently delete your responder account. These
          actions affect your profile, operational records, and command-center
          access.
        </p>

        {/* Mode selection — radio buttons */}
        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">Choose a deactivation mode</legend>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${
              selected === "soft"
                ? "border-amber-400/60 bg-amber-500/10"
                : "border-panel-border bg-surface-muted/40 hover:border-amber-400/40"
            }`}
          >
            <input
              type="radio"
              name="deactivation-mode"
              value="soft"
              checked={selected === "soft"}
              onChange={() => setSelected("soft")}
              className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-200">
                Soft Deactivate
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                Profile hidden from the command center; data retained for 30
                days and fully recoverable by the control room.
              </span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 transition ${
              selected === "hard"
                ? "border-red-500/60 bg-red-500/10"
                : "border-panel-border bg-surface-muted/40 hover:border-red-500/40"
            }`}
          >
            <input
              type="radio"
              name="deactivation-mode"
              value="hard"
              checked={selected === "hard"}
              onChange={() => setSelected("hard")}
              className="mt-0.5 h-4 w-4 shrink-0 accent-red-500"
            />
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-200">
                Permanent Deletion
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                Irreversible. Your account, profile, chat history, and
                operational records are permanently destroyed.
              </span>
            </span>
          </label>
        </fieldset>

        {/* Delete Account — opens the strict confirmation modal */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-500/30 bg-red-500/[0.05] p-4">
          <p className="max-w-xs text-xs text-slate-400">
            Deletion requires a typed confirmation phrase before it can be
            submitted.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_0_18px_rgba(220,38,38,0.35)] transition hover:bg-red-500 active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete Account
          </button>
        </div>
      </section>

      {/* Strict confirmation modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="danger-zone-modal-title"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-eoc border-2 border-red-600/60 bg-surface p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden />
              </div>
              <div>
                <h2
                  id="danger-zone-modal-title"
                  className="text-base font-bold text-red-300"
                >
                  {selected === "soft"
                    ? "Confirm soft deactivation?"
                    : "Permanently delete your account?"}
                </h2>
                <p className="mt-1.5 text-sm text-slate-400">
                  {selected === "soft"
                    ? "Your profile will be hidden and data retained for 30 days. This can be reversed by contacting the control room."
                    : "This permanently deletes your account, profile, chat history, and all operational records. This action cannot be undone."}
                </p>
              </div>
            </div>

            <label
              htmlFor="danger-zone-phrase"
              className="mt-5 block text-xs font-semibold text-slate-300"
            >
              Type{" "}
              <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-red-300">
                {CONFIRM_PHRASE}
              </code>{" "}
              to enable deletion
            </label>
            <input
              id="danger-zone-phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              autoFocus
              className="mt-2 w-full rounded-md border border-panel-border bg-[#0a0f1d] px-3 py-2.5 font-mono text-sm font-bold tracking-wider text-slate-100 outline-none placeholder:text-slate-600 focus:border-red-400/60"
            />

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={deleting}
                className="rounded-md border border-panel-borderHover px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={phrase !== CONFIRM_PHRASE || deleting}
                onClick={confirmDeletion}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {deleting
                  ? "Deleting…"
                  : selected === "soft"
                    ? "Deactivate Account"
                    : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
