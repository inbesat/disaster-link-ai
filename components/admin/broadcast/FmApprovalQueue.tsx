"use client";

// ---------------------------------------------------------------------
// components/admin/broadcast/FmApprovalQueue.tsx — Phase 7 · FM Broadcast
// Approval (human-in-the-loop).
//
// One card per pending approval request: disaster type + district +
// severity, stations to reach, the AI voice-message preview (playable via
// /api/tts/generate), the RDS scrolling-text preview, and a live
// auto-approval countdown. Actions:
//   • Approve & Broadcast Now (green) — CAP + dispatch immediately.
//   • Edit Message First (secondary) — inline edit, then approve.
//   • Reject / Cancel (red).
// Requests past their window are auto-approved by the server on refresh.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Check,
  Loader2,
  Pencil,
  PhoneCall,
  Play,
  Radio,
  RefreshCw,
  ScrollText,
  Volume2,
  X,
} from "lucide-react";

interface ApprovalDTO {
  id: string;
  disasterEventId: string | null;
  district: string;
  disasterType: string;
  severity: string;
  message: string;
  rdsText: string;
  stationsCount: number;
  status: string;
  autoApproveAt: string;
  createdAt: string;
}

const DISASTER_LABELS: Record<string, string> = {
  flood: "Flood",
  cyclone: "Cyclone",
  earthquake: "Earthquake",
  heatwave: "Heatwave",
};

function severityBadge(severity: string) {
  const critical = severity === "critical";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${
        critical
          ? "bg-red-500/10 text-red-400"
          : "bg-amber-500/10 text-amber-300"
      }`}
    >
      {critical ? <AlertTriangle className="h-3 w-3" /> : null}
      {critical ? "Critical" : "Warning"}
    </span>
  );
}

function countdown(now: number, autoApproveAt: string): string | null {
  const remaining = new Date(autoApproveAt).getTime() - now;
  if (remaining <= 0) return "now";
  const seconds = Math.floor(remaining / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function FmApprovalQueue() {
  const [approvals, setApprovals] = useState<ApprovalDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/broadcast/fm/approvals");
      const data = (await res.json()) as { approvals?: ApprovalDTO[] };
      setApprovals(data.approvals ?? []);
    } catch (error) {
      console.error("Failed to load approvals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      setNow(Date.now());
      void refresh();
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const pendingCount = useMemo(
    () => approvals.filter((a) => a.status === "pending").length,
    [approvals],
  );

  async function decide(id: string, action: "approve" | "reject") {
    setDecidingId(id);
    try {
      const res = await fetch(`/api/broadcast/fm/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          message: action === "approve" && editingId === id ? editedMessage : undefined,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Decision failed.");
      } else {
        toast.success(
          action === "approve" ? "Broadcast approved — dispatching now." : "Approval rejected.",
        );
      }
    } catch (error) {
      console.error("Approval decision failed:", error);
      toast.error("Could not reach the approval service.");
    } finally {
      setDecidingId(null);
      setEditingId(null);
      await refresh();
    }
  }

  /** Generate + play the AI voice preview (reuses the Phase 2 pipeline). */
  async function playPreview(approval: ApprovalDTO) {
    setPreviewingId(approval.id);
    try {
      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "hi",
          severity: approval.severity === "critical" ? "critical" : "warning",
          disasterType: approval.disasterType,
          district: approval.district,
          message: approval.message,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        audioUrl?: string | null;
        audioDataUri?: string | null;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not generate the voice preview.");
        return;
      }
      const src = data.audioUrl ?? data.audioDataUri;
      if (!src) {
        toast.error("No audio returned.");
        return;
      }
      const audio = new Audio(src);
      audio.onended = () => setPreviewingId(null);
      audio.onerror = () => {
        setPreviewingId(null);
        toast.error("Audio playback failed.");
      };
      void audio.play();
    } catch (error) {
      console.error("Voice preview failed:", error);
      toast.error("Could not reach the TTS service.");
      setPreviewingId(null);
    }
  }

  const cardClass = "rounded-lg border border-panel-border bg-panel p-5";

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- Header */}
      <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Broadcast Approval Queue
          </h2>
          {pendingCount > 0 && (
            <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400">
              {pendingCount} pending
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-primary px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-amber-300"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ------------------------------------------------------ Cards */}
      {loading && approvals.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-panel-border text-center">
          <Check className="mb-2 h-8 w-8 text-emerald-500/60" />
          <p className="text-sm text-slate-500">No pending broadcast approvals.</p>
          <p className="mt-1 text-xs text-slate-600">
            Escalated predictions with manual rules appear here for sign-off.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {approvals.map((approval) => {
            const remaining = countdown(now, approval.autoApproveAt);
            const editing = editingId === approval.id;
            return (
              <article key={approval.id} className={cardClass}>
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-panel-border bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-300">
                    {DISASTER_LABELS[approval.disasterType] ?? approval.disasterType}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {approval.district}
                  </span>
                  {severityBadge(approval.severity)}
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500">
                    <Radio className="h-3.5 w-3.5" />
                    {approval.stationsCount} stations to reach
                  </span>
                </div>

                {/* Auto-approval countdown */}
                <p
                  className={`mt-3 inline-flex items-center gap-1.5 rounded px-2 py-1 text-[0.6875rem] font-semibold ${
                    remaining === "now"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-300"
                  }`}
                >
                  {remaining === "now" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" /> Auto-approving now…
                    </>
                  ) : (
                    <>
                      Auto-broadcast in {remaining} if no action
                    </>
                  )}
                </p>

                {/* Voice message preview */}
                <div className="mt-3 rounded-md border border-panel-border bg-primary p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
                      <Volume2 className="h-3 w-3" /> AI Voice Message
                    </p>
                    <button
                      type="button"
                      onClick={() => void playPreview(approval)}
                      disabled={previewingId !== null}
                      className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[0.6875rem] font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {previewingId === approval.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      {previewingId === approval.id ? "Generating…" : "Play preview"}
                    </button>
                  </div>
                  {editing ? (
                    <textarea
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      rows={5}
                      className="mt-2 w-full resize-none rounded-md border border-panel-border bg-primary px-3 py-2 text-sm text-foreground outline-none transition focus:border-amber-400/50"
                    />
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {approval.message}
                    </p>
                  )}
                </div>

                {/* RDS text preview */}
                <div className="mt-3 rounded-md border border-panel-border bg-primary p-3">
                  <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
                    <ScrollText className="h-3 w-3" /> RDS Scrolling Text
                  </p>
                  <p className="mt-2 font-mono text-xs text-amber-300/90">
                    {approval.rdsText}
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void decide(approval.id, "approve")}
                    disabled={decidingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {decidingId === approval.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve &amp; Broadcast Now
                  </button>
                  {!editing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(approval.id);
                        setEditedMessage(approval.message);
                      }}
                      disabled={decidingId !== null}
                      className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-primary px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-amber-300 disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" /> Edit Message First
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      disabled={decidingId !== null}
                      className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-primary px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-amber-300 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Cancel Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void decide(approval.id, "reject")}
                    disabled={decidingId !== null}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                  >
                    <PhoneCall className="hidden" />
                    Reject / Cancel
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
