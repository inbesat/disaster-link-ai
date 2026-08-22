"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  MessagesSquare,
  Building2,
  X,
  PenLine,
  Zap,
} from "lucide-react";
import { executeBulkAction } from "@/app/actions/admin";

type BulkAction = "sms" | "shelter" | "fleet" | null;

const CARDS = [
  {
    id: "sms",
    title: "Mass SMS Blast",
    description:
      "Broadcast critical guidance to thousands of responders in one action.",
    icon: MessagesSquare,
    accent: "border-amber-400/50",
  },
  {
    id: "shelter",
    title: "Bulk Shelter Status Update",
    description:
      "Flip shelter open/close status across a district in one shot.",
    icon: Building2,
    accent: "border-emerald-400/50",
  },
  {
    id: "fleet",
    title: "Fleet Reallocation",
    description:
      "Reasssign boats and vehicles between depots and disaster sites.",
    icon: PenLine,
    accent: "border-sky-400/50",
  },
] as const;

const AUDIENCE_GROUPS = [
  {
    id: "ff_patna",
    label: "All Field Responders in Patna",
    hint: "142 responders",
  },
  {
    id: "da_sitamarhi",
    label: "All District Admins in Sitamarhi",
    hint: "6 admins",
  },
  {
    id: "ngo_volunteers",
    label: "NGO Volunteer Corps (all districts)",
    hint: "310 volunteers",
  },
  {
    id: "ndrf_units",
    label: "NDRF / SDRF Mobile Units",
    hint: "18 units",
  },
];

const CARD_META: Record<
  Exclude<BulkAction, null>,
  { topic: string; actionCode: string }
> = {
  sms: { topic: "SMS", actionCode: "BULK_SMS_BLAST" },
  shelter: { topic: "Shelter", actionCode: "BULK_SHELTER_UPDATE" },
  fleet: { topic: "Fleet", actionCode: "BULK_FLEET_REALLOCATION" },
};

export default function BulkOperationsPage() {
  const [openAction, setOpenAction] = useState<BulkAction>(null);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function openCard(id: Exclude<BulkAction, null>) {
    setSelected([]);
    setMessage("");
    setOpenAction(id);
  }

  function toggleAudience(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function execute() {
    const action = openAction;
    if (!action) return;

    if (action === "sms") {
      if (!message.trim()) {
        toast.error("Please enter a message to broadcast");
        return;
      }
      if (selected.length === 0) {
        toast.error("Select at least one target audience");
        return;
      }
    }

    setBusy(true);
    const meta = CARD_META[action];
    await executeBulkAction(
      meta.actionCode,
      "bulk",
      action === "sms"
        ? `${selected.length} audience group(s) · "${message.slice(0, 60)}"`
        : meta.topic,
    );
    await new Promise((r) => setTimeout(r, 1400));
    setBusy(false);

    toast.success(`Bulk ${meta.topic} action executed successfully`);
    setOpenAction(null);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Bulk Operations</h1>
        <p className="mt-1 text-sm text-slate-400">
          Fire wide-reaching actions across districts. Confirmed in a modal —
          nothing fires until you hit EXECUTE.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CARDS.map(({ id, title, description, icon: Icon, accent }) => (
          <button
            key={id}
            type="button"
            onClick={() => openCard(id)}
            className={`group flex flex-col items-start gap-3 rounded-lg border border-panel-border ${accent} bg-panel p-6 text-left transition hover:-translate-y-0.5 hover:bg-panel-hover`}
          >
            <Icon className="h-6 w-6 text-amber-300" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            </div>
            <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-300/80 transition group-hover:text-amber-300">
              Configure →
            </span>
          </button>
        ))}
      </div>

      {openAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Configure ${CARD_META[openAction].topic} bulk action`}
        >
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !busy && setOpenAction(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl border border-panel-borderStrong bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-panel-border px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {openAction === "sms"
                    ? "Mass SMS Blast"
                    : CARD_META[openAction].topic + " Bulk Action"}
                </h2>
                <p className="text-xs text-slate-500">
                  {openAction === "sms"
                    ? "Draft broadcast and pick target audiences"
                    : "Confirm and execute this bulk operation"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpenAction(null)}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-panel-chip hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {openAction === "sms" ? (
                <>
                  <div>
                    <label htmlFor="sms-text" className="text-sm font-medium text-foreground">
                      Message Text
                    </label>
                    <textarea
                      id="sms-text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={160}
                      placeholder="Type the broadcast message limited to 160 chars…"
                      className="mt-2 w-full resize-none rounded-md border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/30"
                    />
                    <p className="mt-1 text-right text-xs text-slate-500">
                      {message.length}/160
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground">Target Audiences</p>
                    <div className="mt-2 space-y-2">
                      {AUDIENCE_GROUPS.map((g) => {
                        const checked = selected.includes(g.id);
                        return (
                          <label
                            key={g.id}
                            className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 transition ${
                              checked
                                ? "border-amber-400/50 bg-amber-500/10"
                                : "border-panel-border bg-surface-elevated hover:border-panel-borderStrong"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleAudience(g.id)}
                                className="h-4 w-4 accent-amber-500"
                              />
                              <span className="text-sm text-foreground">{g.label}</span>
                            </span>
                            <span className="text-xs text-slate-500">{g.hint}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  This bulk {CARD_META[openAction].topic.toLowerCase()} operation will
                  be applied to all matching districts. Confirm below to execute.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-panel-border px-6 py-4">
              <button
                type="button"
                onClick={() => !busy && setOpenAction(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={execute}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/15 px-5 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/25 disabled:opacity-60"
              >
                <Zap className="h-4 w-4" />
                {busy ? "Executing…" : "EXECUTE BULK ACTION"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}