"use client";

import { useState } from "react";
import { Radio, Send, Megaphone, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { playAlarm } from "@/lib/field-offline";

const OVERRIDE_PRESET = "Evacuate Sector 4 immediately!";

export default function BroadcastMessage() {
  const [message, setMessage] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function submit() {
    const text = message.trim() || OVERRIDE_PRESET;
    setSending(true);
    // Simulate the WebSocket fan-out to all connected clients.
    window.setTimeout(() => {
      setActive(text);
      playAlarm();
      setSending(false);
      setMessage("");
    }, 350);
  }

  function acknowledge() {
    setActive(null);
    toast.success("Acknowledged — all field responders updated.");
  }

  return (
    <>
      {/* Admin flash-messaging input */}
      <section className="rounded-eoc border border-border bg-surface p-4 shadow-glow-accent">
        <h2 className="eoc-label flex items-center gap-2 text-accent">
          <Megaphone className="h-4 w-4" />
          COMMAND BROADCAST
        </h2>
        <label htmlFor="broadcast-input" className="mt-1 block text-sm text-slate-300">
          Broadcast to all Field Responders
        </label>
        <textarea
          id="broadcast-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          placeholder={`e.g. ${OVERRIDE_PRESET}`}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-red-400 bg-red-500/15 px-4 text-sm font-bold uppercase tracking-wider text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
        >
          {sending ? (
            <Radio className="h-5 w-5 animate-pulse" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          {sending ? "Broadcasting…" : "Broadcast"}
        </button>
      </section>

      {/* Screen-wide emergency override overlay */}
      {active && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-live="assertive"
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border-4 border-red-500 bg-[#1a0606] text-center shadow-[0_0_80px_rgba(239,68,68,0.6)]">
            <div className="bg-red-600 px-4 py-3">
              <p className="eoc-label text-white">
                🚨 COMMAND CENTER OVERRIDE 🚨
              </p>
            </div>
            <div className="px-6 py-8">
              <p className="text-2xl font-black leading-snug text-white">
                {active}
              </p>
              <p className="mt-3 text-sm text-red-200/80">
                Broadcast delivered to all field responders via secure push.
              </p>
              <button
                type="button"
                onClick={acknowledge}
                className="mt-6 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-400 bg-emerald-600 text-lg font-black text-white transition active:scale-[0.98]"
              >
                <ShieldCheck className="h-6 w-6" />
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}