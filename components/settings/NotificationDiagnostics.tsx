"use client";

// ---------------------------------------------------------------------
// components/settings/NotificationDiagnostics.tsx — Settings · Phase 2 · Step 7/8.
//
// Connection Diagnostics suite for /settings/notifications:
//   • Four delivery-channel test actions:
//       - Test In-App   → instantly fires a mocked critical-alert toast
//                         (loud styling + synthesized siren beep).
//       - Test Browser Push / Email / SMS → simulate an API call: 1s
//                         spinner on the button, then a green "Sent
//                         Successfully" checkmark.
//   • Slide the channel label into the button so the result state is
//     unmistakable without taking layout away.
// ---------------------------------------------------------------------

import { useState, type ComponentType } from "react";
import toast from "react-hot-toast";
import {
  Bell,
  Check,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Radio,
  Send,
  TriangleAlert,
} from "lucide-react";

type ChannelId = "toast" | "browser_push" | "email" | "sms";

type TestChannel = {
  id: ChannelId;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const CHANNELS: TestChannel[] = [
  { id: "toast", label: "Test In-App Toast", icon: Inbox },
  { id: "browser_push", label: "Test Browser Push", icon: Bell },
  { id: "email", label: "Test Email", icon: Mail },
  { id: "sms", label: "Test SMS", icon: MessageSquare },
];

type TestState = "idle" | "sending" | "sent";

const INITIAL_STATES: Record<ChannelId, TestState> = {
  toast: "idle",
  browser_push: "idle",
  email: "idle",
  sms: "idle",
};

export default function NotificationDiagnostics() {
  const [states, setStates] = useState<Record<ChannelId, TestState>>(
    INITIAL_STATES,
  );

  function playCriticalAlertSound() {
    try {
      const Ctor: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctor();
      const now = ctx.currentTime;
      // Two-tone red siren (740 → 980 Hz), same idea as the field beep.
      [740, 980].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.22;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {
      // Audio unavailable (unsupported browser) — visual toast still works.
    }
  }

  function fireInAppToast() {
    playCriticalAlertSound();
    toast.custom(
      () => (
        <div className="pointer-events-auto flex items-start gap-3 rounded-lg border-2 border-red-500/70 bg-[#1a0f1f] px-4 py-3 shadow-[0_0_24px_rgba(239,68,68,0.45)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-500/20">
            <TriangleAlert className="h-5 w-5 text-red-400" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-400">
              CRITICAL — Evacuation Order
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-100">
              Flood surge inbound — Sampatchak block. Move families to
              higher ground.
            </p>
            <p className="mt-0.5 text-[11px] text-red-300/70">
              Test notification · routed via In-App · severity: Critical
            </p>
          </div>
        </div>
      ),
      { duration: 6000, position: "top-right" },
    );
  }

  function handleSend(channel: TestChannel) {
    if (channel.id === "toast") {
      fireInAppToast();
      return;
    }

    setStates((prev) => ({ ...prev, [channel.id]: "sending" }));
    // Mock an API round-trip.
    window.setTimeout(() => {
      setStates((prev) => ({ ...prev, [channel.id]: "sent" }));
      window.setTimeout(() => {
        setStates((prev) => ({ ...prev, [channel.id]: "idle" }));
      }, 2500);
    }, 1000);
  }

  return (
    <section
      data-settings-key="notification-diagnostics"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-fuchsia-500/10">
          <Radio className="h-5 w-5 text-fuchsia-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-fuchsia-300/80">CONNECTION DIAGNOSTICS</p>
          <h2 className="mt-0.5 text-lg font-bold">Test your alert routes</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Fire a test ping down each channel to confirm delivery end to end.
        In-app fires instantly; the others simulate a 1s network round-trip.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((channel) => {
          const state = states[channel.id];
          const Icon = channel.icon;
          const isToast = channel.id === "toast";
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => handleSend(channel)}
              disabled={state === "sending"}
              data-testid={`test-${channel.id}`}
              className={`group relative flex items-center gap-3 rounded-md border px-4 py-3 text-left transition ${
                state === "sent"
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : isToast
                    ? "border-panel-borderHover bg-surface-muted/40 hover:border-red-400/60"
                    : "border-panel-borderHover bg-surface-muted/40 hover:border-fuchsia-400/60"
              } ${state === "sending" ? "cursor-wait opacity-70" : "cursor-pointer"}`}
              aria-live={state === "sending" ? "polite" : "off"}
            >
              {/* Leading icon */}
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                  state === "sent"
                    ? "bg-emerald-500/15"
                    : isToast
                      ? "bg-red-500/10"
                      : "bg-fuchsia-500/10"
                }`}
              >
                {state === "sent" ? (
                  <Check className="h-5 w-5 text-emerald-400" aria-hidden />
                ) : state === "sending" ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-300" aria-hidden />
                ) : (
                  <Icon
                    className={`h-5 w-5 ${
                      isToast ? "text-red-400" : "text-fuchsia-300"
                    }`}
                    aria-hidden
                  />
                )}
              </span>

              {/* Label — swaps to a success line once delivered */}
              <span className="min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    state === "sent" ? "text-emerald-300" : "text-slate-200"
                  }`}
                >
                  {state === "sent" ? "Sent Successfully" : channel.label}
                </span>
                <span className="block truncate text-[11px] text-slate-500">
                  {state === "sent"
                    ? `${channel.label.split("Test ")[1] ?? "Channel"} · delivered`
                    : isToast
                      ? "Fires a mock critical alert now"
                      : "1s simulated API round-trip"}
                </span>
              </span>

              {/* Delivery marker */}
              {state === "sent" && (
                <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                  <Send className="h-3 w-3 text-emerald-400" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Send className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Diagnostics never affect real users — they only play a marker alert
        against your own device.
      </p>
    </section>
  );
}