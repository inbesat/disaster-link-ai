"use client";

import { useState } from "react";
import { Siren } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Demo trigger for the command-room "Emergency Recall Order" dispatch.
 * POSTs to /api/field/broadcast so the broadcast is stored server-side (the
 * field recall banner picks it up on its next poll — on every device) and a
 * Web Push notification is fired at subscribed responders (Phase 19 step 9).
 * The same device still flashes the full-screen alert instantly via the
 * "drip:recall-test" event, carrying the server-issued broadcast id so the
 * poll doesn't re-show it.
 */
export default function RecallTestButton() {
  const [sending, setSending] = useState(false);

  async function dispatch() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/field/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        ok: boolean;
        broadcast?: { id: string; title: string; message: string; sector: string; sentAt: string };
        push?: { delivered?: number; failed?: number; skipped?: string };
      };
      if (data.ok && data.broadcast) {
        // Instant full-screen alert on this device with the server id.
        window.dispatchEvent(
          new CustomEvent("drip:recall-test", { detail: data.broadcast }),
        );
        if (data.push && data.push.delivered) {
          toast.success(`Recall dispatched — push sent to ${data.push.delivered} device(s).`);
        } else if (data.push && data.push.failed) {
          toast.error(`Recall dispatched, but push failed on ${data.push.failed} device(s).`);
        } else if (data.push && data.push.skipped) {
          toast(`Recall dispatched. Web push ${data.push.skipped.toLowerCase()}`, {
            icon: "📡",
          });
        } else {
          toast.success("Recall order dispatched to all field responders.");
        }
        return;
      }
      throw new Error("Dispatch failed");
    } catch {
      // Command center unreachable — fall back to the local-only simulation.
      window.dispatchEvent(new CustomEvent("drip:recall-test"));
      toast("Command center offline — recall shown locally only.", { icon: "⚠️" });
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
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2 border-red-400/60 bg-red-500/10 text-base font-black text-red-300 transition hover:bg-red-500/20 disabled:opacity-60"
      >
        <Siren className={`h-6 w-6 ${sending ? "animate-pulse" : ""}`} />
        {sending ? "Dispatching…" : "Emergency Recall Order (Test Dispatch)"}
      </button>
      <p className="mt-2 text-center text-sm text-gray-500">
        Dispatches via the command-room API — stores the broadcast and pushes a
        notification to every subscribed responder.
      </p>
    </section>
  );
}
