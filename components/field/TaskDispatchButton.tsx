"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Demo trigger for the command-room "dispatch a critical task" flow. POSTs to
 * /api/assignments/notify, which fires a Web Push at subscribed field
 * responders (Phase 19 step 9 — push for critical task assignments).
 */
export default function TaskDispatchButton() {
  const [sending, setSending] = useState(false);

  async function dispatch() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/assignments/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Flooding reported at Bypass Road culvert — verify & flag closure",
          priority: "CRITICAL",
          location: "Bypass Road, Patna",
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        pushed?: boolean;
        push?: { delivered?: number; failed?: number; skipped?: string };
      };
      if (!data.ok) throw new Error("Dispatch failed");
      if (data.push && data.push.delivered) {
        toast.success(`Critical task dispatched — push sent to ${data.push.delivered} device(s).`);
      } else if (data.push && data.push.failed) {
        toast.error(`Task dispatched, but push failed on ${data.push.failed} device(s).`);
      } else {
        toast(`Critical task dispatched. Web push ${data.push?.skipped?.toLowerCase() ?? "skipped"}`, {
          icon: "📡",
        });
      }
    } catch {
      toast.error("Command center unreachable — task not dispatched.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-xl border-2 border-panel-border bg-panel-deep p-4">
      <button
        type="button"
        onClick={() => void dispatch()}
        disabled={sending}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2 border-orange-400/60 bg-orange-500/10 text-base font-black text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-60"
      >
        <ClipboardList className={`h-6 w-6 ${sending ? "animate-pulse" : ""}`} />
        {sending ? "Dispatching…" : "Dispatch Critical Task (Test)"}
      </button>
      <p className="mt-2 text-center text-sm text-gray-500">
        Simulates the command room assigning a CRITICAL task — pushes a
        notification to every subscribed responder.
      </p>
    </section>
  );
}
