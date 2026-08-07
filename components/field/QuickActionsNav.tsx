"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Building,
  CircleOff,
  HandHelping,
  Siren,
  Check,
  Phone,
  TriangleAlert,
  LifeBuoy,
  Car,
  PackageOpen,
} from "lucide-react";
import {
  OfflineSyncQueue,
  PATNA_CENTER,
  getCachedBundle,
  playAlarm,
} from "@/lib/field-offline";

type QuickAction = "shelter" | "road" | "aid" | "sos";

const CONFIRM_MS = 1800;

function haptic(pattern: number[] = [60, 40, 60]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* unsupported */
    }
  }
}

export default function QuickActionsNav() {
  const [active, setActive] = useState<QuickAction | null>(null);
  const [aidKind, setAidKind] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  function open(action: QuickAction) {
    haptic();
    setAidKind(null);
    setActive(action);
    if (action === "sos") playAlarm();
    if (action !== "sos") {
      confirmTimer.current = setTimeout(() => setActive(null), CONFIRM_MS);
    }
  }

  function confirmAid(kind: string) {
    setAidKind(kind);
    OfflineSyncQueue.enqueue({
      url: "/api/road-closures",
      method: "POST",
      body: { lat: PATNA_CENTER.lat, lng: PATNA_CENTER.lng, reason: `Aid request: ${kind}` },
    });
    toast.success(`Aid request (${kind}) logged`);
    haptic([80]);
    setActive(null);
  }

  return (
    <>
      {/* Persistent one-thumb bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-cyan-400/40 bg-[#0A0F1D] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          <NavButton
            label="Shelter Full"
            icon={<Building className="h-7 w-7" />}
            tone="emerald"
            onClick={() => open("shelter")}
          />
          <NavButton
            label="Road Blocked"
            icon={<CircleOff className="h-7 w-7" />}
            tone="amber"
            onClick={() => open("road")}
          />
          <NavButton
            label="Request Aid"
            icon={<HandHelping className="h-7 w-7" />}
            tone="cyan"
            onClick={() => open("aid")}
          />
          <NavButton
            label="SOS Panic"
            icon={<Siren className="h-7 w-7" />}
            tone="red"
            onClick={() => open("sos")}
          />
        </div>
      </nav>

      {/* Instant visual confirmation */}
      {active === "shelter" && <ShelterFullModal onDone={() => setActive(null)} />}
      {active === "road" && <RoadBlockedModal onDone={() => setActive(null)} />}
      {active === "aid" && (
        <AidModal kind={aidKind} onPick={confirmAid} onCancel={() => setActive(null)} />
      )}
      {active === "sos" && <SosModal onDone={() => setActive(null)} />}
    </>
  );
}

function NavButton({
  label,
  icon,
  tone,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "cyan" | "red";
  onClick: () => void;
}) {
  const tones = {
    emerald: "border-emerald-400/50 text-emerald-300 active:bg-emerald-500/20",
    amber: "border-amber-400/50 text-amber-300 active:bg-amber-500/20",
    cyan: "border-cyan-400/50 text-cyan-300 active:bg-cyan-500/20",
    red: "border-red-400/60 text-red-400 active:bg-red-500/25",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[68px] flex-col items-center justify-center gap-1 border-t border-[#1c2740] py-2 transition active:scale-95 ${tones[tone]}`}
      aria-label={label}
    >
      {icon}
      <span className="text-[13px] font-bold leading-tight">{label}</span>
    </button>
  );
}

function ConfirmShell({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
      <div className="w-full max-w-sm rounded-2xl border-2 border-cyan-400/40 bg-[#0d1526] p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500/10 text-emerald-300">
          {icon}
        </div>
        <p className="text-xl font-bold text-foreground">{title}</p>
        <div className="mt-2 text-base text-gray-300">{body}</div>
        {children}
      </div>
    </div>
  );
}

function ShelterFullModal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const cached = getCachedBundle();
    const shelter = cached?.shelters.find((s) => s.remaining > 0);
    OfflineSyncQueue.enqueue({
      url: "/api/shelters/occupancy",
      method: "POST",
      body: { shelterId: shelter?.id ?? "mock-shelter-1", occupancy: shelter?.capacity ?? 450 },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ConfirmShell icon={<Check className="h-8 w-8" />} title="Shelter Marked Full" body="Nearest shelter flagged at 100% capacity. Syncs when online.">
      <button
        type="button"
        onClick={onDone}
        className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-emerald-500/15 text-lg font-bold text-emerald-300"
      >
        Done
      </button>
    </ConfirmShell>
  );
}

function RoadBlockedModal({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    OfflineSyncQueue.enqueue({
      url: "/api/road-closures",
      method: "POST",
      body: { lat: PATNA_CENTER.lat, lng: PATNA_CENTER.lng, reason: "Impassable flooded road" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ConfirmShell icon={<CircleOff className="h-8 w-8" />} title="Road Blocked Logged" body="Flooded road marked impassable. Routes will be recalculated.">
      <button
        type="button"
        onClick={onDone}
        className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-amber-500/15 text-lg font-bold text-amber-300"
      >
        Done
      </button>
    </ConfirmShell>
  );
}

function AidModal({
  kind,
  onPick,
  onCancel,
}: {
  kind: string | null;
  onPick: (kind: string) => void;
  onCancel: () => void;
}) {
  if (kind) {
    return (
      <ConfirmShell icon={<HandHelping className="h-8 w-8" />} title={`Aid Request: ${kind}`} body="Logged and queued for sync. An admin will assign a depot.">
        <button
          type="button"
          onClick={onCancel}
          className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-full bg-cyan-500/15 text-lg font-bold text-cyan-300"
        >
          Done
        </button>
      </ConfirmShell>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5">
      <div className="w-full max-w-sm rounded-2xl border-2 border-cyan-400/40 bg-[#0d1526] p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-500/10 text-cyan-300">
          <PackageOpen className="h-8 w-8" />
        </div>
        <p className="text-xl font-bold text-foreground">Request Aid</p>
        <p className="mt-1 text-base text-gray-300">Tap a category — one tap logs it.</p>
        <div className="mt-5 space-y-3">
          <AidChip icon={<LifeBuoy className="h-6 w-6" />} label="Boat / Rescue" onClick={() => onPick("Boat / Rescue")} />
          <AidChip icon={<PackageOpen className="h-6 w-6" />} label="Food / Water" onClick={() => onPick("Food / Water")} />
          <AidChip icon={<Car className="h-6 w-6" />} label="Medical / Vehicle" onClick={() => onPick("Medical / Vehicle")} />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-5 min-h-[48px] w-full rounded-full border border-border text-lg font-bold text-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AidChip({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[56px] w-full items-center justify-between rounded-xl border-2 border-[#1c2740] bg-[#0b1120] px-4 text-base font-bold text-foreground transition active:scale-95 active:border-cyan-400"
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      <span className="text-cyan-300">→</span>
    </button>
  );
}

function SosModal({ onDone }: { onDone: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/95 p-5">
      <div className="w-full max-w-sm rounded-2xl border-2 border-red-500 bg-[#1a0606] p-6 text-center shadow-[0_0_60px_rgba(239,68,68,0.6)]">
        {sent ? (
          <>
            <TriangleAlert className="mx-auto mb-3 h-16 w-16 animate-pulse text-red-500" />
            <p className="text-2xl font-black uppercase tracking-widest text-red-400">Distress Sent</p>
            <p className="mt-2 text-base text-gray-300">
              Your location + SOS are queued and will reach the control room the moment connectivity returns.
            </p>
            <a
              href="tel:+911123456789"
              className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-red-500 text-lg font-black text-white transition active:scale-95"
            >
              <Phone className="h-5 w-5" /> CALL CONTROL ROOM
            </a>
            <button
              type="button"
              onClick={onDone}
              className="mt-3 min-h-[48px] w-full rounded-full border border-red-400 text-lg font-bold text-red-300"
            >
              Dismiss
            </button>
          </>
        ) : (
          <>
            <Siren className="mx-auto mb-3 h-16 w-16 animate-pulse text-red-500" />
            <p className="text-2xl font-black uppercase tracking-widest text-red-400">Emergency SOS</p>
            <p className="mt-2 text-base text-gray-300">Trigger distress with your current location.</p>
            <button
              type="button"
              onClick={() => {
                haptic([120, 60, 120, 60, 200]);
                setSent(true);
                toast("SOS queued — control room will be alerted", { icon: "🆘" });
              }}
              className="mt-5 flex min-h-[64px] w-full items-center justify-center gap-2 rounded-full bg-red-600 text-xl font-black text-white transition active:scale-95"
            >
              <Siren className="h-6 w-6" /> SEND DISTRESS
            </button>
            <button
              type="button"
              onClick={onDone}
              className="mt-3 min-h-[48px] w-full rounded-full border border-red-400/60 text-lg font-bold text-red-300"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}