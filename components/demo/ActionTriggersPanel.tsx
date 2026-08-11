"use client";

// ---------------------------------------------------------------------
// components/demo/ActionTriggersPanel.tsx — Phase 2 · Step 7 · One-Click
// Action Triggers ("God Mode").
//
// A hidden, collapsible floating panel pinned to the right edge of the
// screen (gated in app/layout.tsx on the demo cookie, exactly like the
// ScenarioSelector). It lets the presenter force specific events during
// the live pitch with ONE tap:
//
//   Government mode  → "Trigger Flood Warning" · "Send Test Alert" ·
//                      "Deploy Resource" · "Close Road"
//   Public (citizen) → "Elevate My Risk" · "Receive Alert" ·
//                      "Trigger SOS" · "Force Route Reroute"
//
// Every button instantly executes the matching UI update / mock API call
// and records itself in the Step 9 judge-tracking analytics, so the
// presenter can later quote "judges triggered the SOS 4 times".
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BellRing,
  Flame,
  Loader2,
  MapPinOff,
  RefreshCw,
  Siren,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { triggerHeavyHaptic } from "@/hooks/useHaptics";
import { showToast } from "@/components/ui/Toast";
import { addRoadClosure } from "@/lib/map/road-closures-client";
import { setDemoModeStore, trackAnalytics, type DemoMode } from "@/lib/demo/analytics";

type ActionTone = "red" | "amber" | "blue" | "violet";

type PanelAction = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone: ActionTone;
  run: () => void;
};

const TONE_CLASSES: Record<ActionTone, string> = {
  red: "border-red-500/40 bg-red-600/15 text-red-300 hover:bg-red-600/25",
  amber: "border-amber-500/40 bg-amber-600/15 text-amber-300 hover:bg-amber-600/25",
  blue: "border-blue-500/40 bg-blue-600/15 text-blue-300 hover:bg-blue-600/25",
  violet: "border-violet-500/40 bg-violet-600/15 text-violet-300 hover:bg-violet-600/25",
};

/** Mock server-action hub call shared by the API-backed triggers. */
async function runScenario(action: string) {
  const res = await fetch("/api/demo/scenario", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  return (await res.json()) as {
    ok: boolean;
    mock?: boolean;
    resource?: string;
    quantity?: number;
    destination?: string;
    status?: string;
    road?: string;
    message?: string;
  };
}

type ActionTriggersPanelProps = {
  mode: DemoMode;
};

export default function ActionTriggersPanel({ mode }: ActionTriggersPanelProps) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Keep the analytics mode mirror in sync with the active demo role.
  useEffect(() => {
    setDemoModeStore(mode);
  }, [mode]);

  async function handle(actionId: string, cb: () => Promise<void> | void) {
    setBusyId(actionId);
    triggerHeavyHaptic();
    trackAnalytics(`action.${mode === "government" ? "gov" : "pub"}.${actionId}`, mode);
    try {
      await cb();
    } finally {
      setBusyId(null);
    }
  }

  const governmentActions: PanelAction[] = [
    {
      id: "flood-warning",
      label: "Trigger Flood Warning",
      icon: AlertTriangle,
      tone: "red",
      run: async () => {
        try {
          const res = await fetch("/api/field/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: "⚠️ CRITICAL FLOOD WARNING — PATNA",
              message:
                "Ganga water level at danger mark — evacuate floodplain villages in Patna immediately. Zones: Kankarbagh, Rajendra Nagar.",
              sector: "Patna (Ganga) · Floodplain",
            }),
          });
          const data = (await res.json()) as { push?: unknown };
          showToast("success", {
            id: "god-flood-warning",
            title: "💥 Critical Flood Warning issued",
            description: data.push
              ? "Recall banner + Web Push dispatched to every responder."
              : "Recall banner fresh — field units will see it on next poll.",
          });
        } catch {
          showToast("success", {
            id: "god-flood-warning",
            title: "💥 Critical Flood Warning issued (simulated)",
          });
        }
      },
    },
    {
      id: "test-alert",
      label: "Send Test Alert",
      icon: Bell,
      tone: "amber",
      run: async () => {
        await fetch("/api/field/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "📢 TEST ALERT — Systems Check",
            message:
              "This is a systems test. No action required. Standing by for live response.",
            sector: "All Patna (Ganga) units",
          }),
        }).catch(() => null);
        showToast("success", {
          id: "god-test-alert",
          title: "📢 Test alert sent",
          description: "Dispatched to all subscribed field units.",
        });
      },
    },
    {
      id: "deploy-resource",
      label: "Deploy Resource",
      icon: Truck,
      tone: "blue",
      run: async () => {
        const data = await runScenario("resource-deploy");
        showToast("success", {
          id: "god-deploy-resource",
          title: "🚁 Resource deployed",
          description: data.mock
            ? "NDRF rescue boats simulated — 4 boats en route to Rajendra Nagar."
            : `${data.resource ?? "Resource"} → ${data.destination ?? "flood zone"} (ETA ${data.status ?? "dispatched"}).`,
        });
      },
    },
    {
      id: "road-close",
      label: "Close Road",
      icon: MapPinOff,
      tone: "violet",
      run: async () => {
        const closure = await addRoadClosure({
          lat: 25.613,
          lng: 85.102,
          reason: "Demo EOC — flooded road (Ashok Rajpath)",
        });
        if (closure) {
          // Persisted + scoped (Step 8 tags it isDemo for this session).
          window.dispatchEvent(new CustomEvent("demo:refresh-roads"));
          showToast("warning", {
            id: "god-road-close",
            title: "⛔ Road closed — Ashok Rajpath",
            description: "Evacuation routes automatically re-solved around it.",
          });
        } else {
          showToast("warning", {
            id: "god-road-close",
            title: "⛔ Road closure placed (simulated)",
            description: "Ashok Rajpath blocked — map layers refresh on next poll.",
          });
        }
      },
    },
  ];

  const publicActions: PanelAction[] = [
    {
      id: "elevate-risk",
      label: "Elevate My Risk",
      icon: Flame,
      tone: "amber",
      run: () => {
        try {
          window.localStorage.setItem("drip:risk-override", "high");
        } catch {
          // Non-fatal — the event below is the visible effect.
        }
        window.dispatchEvent(new CustomEvent("demo:elevate-risk"));
        showToast("warning", {
          id: "god-elevate-risk",
          title: "🔥 Your risk level elevated to HIGH",
          description: "SOS button + nearest-shelter guidance now high-priority.",
        });
      },
    },
    {
      id: "receive-alert",
      label: "Receive Alert",
      icon: BellRing,
      tone: "blue",
      run: () => {
        window.dispatchEvent(new CustomEvent("demo:receive-alert"));
        showToast("info", {
          id: "god-receive-alert",
          title: "🌊 Alert received — Flood Watch, Patna",
          description: "Your zone is under a flood watch. Monitor river levels.",
        });
      },
    },
    {
      id: "trigger-sos",
      label: "Trigger SOS",
      icon: Siren,
      tone: "red",
      run: () => {
        window.dispatchEvent(new CustomEvent("demo:sos-triggered"));
        showToast("error", {
          id: "god-trigger-sos",
          title: "🚨 SOS triggered — location shared",
          description: "Responders and family notified. Hold tight, help is on the way.",
        });
      },
    },
    {
      id: "force-reroute",
      label: "Force Route Reroute",
      icon: RefreshCw,
      tone: "violet",
      run: () => {
        window.dispatchEvent(new CustomEvent("demo:reroute"));
        showToast("warning", {
          id: "god-force-reroute",
          title: "🔄 Safer route found — reroute?",
          description: "Ashok Rajpath flooded. New route avoids 3 hazard zones.",
        });
      },
    },
  ];

  const actions = mode === "government" ? governmentActions : publicActions;
  const header =
    mode === "government"
      ? { title: "⚡ GOD MODE", sub: "Government · one-click triggers" }
      : { title: "⚡ GOD MODE", sub: "Citizen · one-click triggers" };

  return (
    <div className="fixed right-0 top-1/2 z-[80] flex -translate-y-1/2 items-center">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="mr-3 w-72 overflow-hidden rounded-xl border border-amber-500/40 bg-[#0d1526]/95 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-400">
                  {header.title}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-[var(--dl-text-muted)]">
                  {header.sub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Collapse god mode panel"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[var(--dl-text-muted)] transition hover:border-white/25 hover:text-white"
              >
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            </div>

            <ul className="space-y-2 p-3">
              {actions.map(({ id, label, icon: Icon, tone, run }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => void handle(id, run)}
                    disabled={busyId !== null}
                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 ${TONE_CLASSES[tone]}`}
                  >
                    {busyId === id ? (
                      <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    )}
                    {label}
                  </button>
                </li>
              ))}
            </ul>

            <p className="border-t border-white/10 px-4 py-2 text-[0.6875rem] text-[var(--dl-text-muted)]">
              Every tap is logged for the /demo/insights tracker.
            </p>
          </motion.div>
        ) : (
          <motion.button
            key="tab"
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open god mode panel"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            className="flex items-center gap-2 rounded-l-lg border border-r-0 border-amber-500/50 bg-amber-600/90 px-2 py-3 text-black shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition hover:bg-amber-500"
          >
            <Zap aria-hidden="true" className="h-4 w-4 shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest [writing-mode:vertical-rl]">
              God mode
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}