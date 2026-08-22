"use client";

// ---------------------------------------------------------------------
// components/settings/DigestModeCard.tsx — Settings · Phase 2 · Step 7.
//
// Daily Operational Digest batching for /settings/notifications:
//   • Master toggle — "Batch all routine updates (resource movements,
//     shift changes, chat mentions) into a single summary."
//   • When enabled, a time picker selects when the digest is delivered
//     (default 08:00 AM).
//   • Visually linked to the Channel Matrix: the parent page holds the
//     digest state and feeds it to the matrix, so routine (non-critical)
//     rows switch their delivery label from "Instant" to "Batched" while
//     the toggle is on.
//
// The card is fully controlled (props + callbacks) so the matrix badges
// stay in sync with the toggle and picker.
// ---------------------------------------------------------------------

import { CalendarClock, Mailbox, Sun } from "lucide-react";
import { formatTimeLabel } from "@/lib/notification-digest";

export default function DigestModeCard({
  enabled,
  digestTime,
  onEnabledChange,
  onTimeChange,
}: {
  enabled: boolean;
  digestTime: string;
  onEnabledChange: (value: boolean) => void;
  onTimeChange: (value: string) => void;
}) {
  return (
    <section
      data-settings-key="digest-mode"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
          <CalendarClock className="h-5 w-5 text-sky-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-sky-300/80">DIGEST MODE</p>
          <h2 className="mt-0.5 text-lg font-bold">Daily Operational Digest</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Collect routine activity into one calm morning read instead of a
        stream of interruptions.
      </p>

      {/* Batching toggle */}
      <div className="mt-5 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-500/10">
              <Mailbox className="h-4 w-4 text-sky-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Batch all routine updates into a single summary
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                Resource movements, shift changes &amp; chat mentions stream
                into one daily round-up. Critical alerts still break through
                instantly.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Batch routine updates into a daily digest"
            onClick={() => onEnabledChange(!enabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              enabled ? "bg-sky-500" : "bg-[#2c3f6d]"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-[26px]" : "-translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        {/* Delivery time — revealed only when enabled */}
        {enabled && (
          <div className="mt-4 border-t border-[#16213c] pt-4">
            <label
              htmlFor="digest-time"
              className="block text-xs font-semibold text-slate-400"
            >
              Digest delivery time
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                id="digest-time"
                type="time"
                value={digestTime}
                onChange={(e) => onTimeChange(e.target.value)}
                className="w-40 rounded-md border border-panel-borderHover bg-[#0a0f1a] px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-400 [color-scheme:dark]"
                aria-label="Daily digest delivery time"
              />
              <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-400/30 bg-sky-500/10 px-2.5 py-1.5 text-xs font-semibold text-sky-300">
                <Sun className="h-3.5 w-3.5" aria-hidden />
                {formatTimeLabel(digestTime)}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              The digest lands once a day at this time. Routine rows in the
              routing matrix below flip to &quot;Batched&quot; while this is on.
            </p>
          </div>
        )}
      </div>

      {/* Status line */}
      <p
        className={`mt-4 flex items-center gap-2 rounded-md border p-3 text-xs ${
          enabled
            ? "border-sky-400/30 bg-sky-500/[0.07] text-sky-200/90"
            : "border-panel-border bg-surface-muted/40 text-slate-500"
        }`}
      >
        <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {enabled
          ? `Routine notifications batched and delivered at ${formatTimeLabel(
              digestTime,
            )} daily.`
          : "Routine notifications are delivered instantly, channel by channel."}
      </p>
    </section>
  );
}