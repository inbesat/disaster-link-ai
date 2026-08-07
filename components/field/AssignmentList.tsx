"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, MapPin, Navigation, Check, ChevronRight } from "lucide-react";
import {
  listAssignments,
  updateAssignmentStatus,
  type AssignmentStatus,
  type FieldAssignment,
  type TaskPriority,
} from "@/app/actions/assignments";
import { OfflineSyncQueue, PATNA_CENTER } from "@/lib/field-offline";

const STATUS_KEY = "drip_assignment_status_v1";

const STATUS_ORDER: AssignmentStatus[] = ["Not Started", "En Route", "Completed"];

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  CRITICAL: "bg-red-500/15 text-red-400 border-red-500/50",
  HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/50",
  ROUTINE: "bg-sky-500/15 text-sky-300 border-sky-500/50",
};

const STATUS_STYLE: Record<AssignmentStatus, string> = {
  "Not Started": "border-[#1c2740] text-gray-300",
  "En Route": "border-amber-400/60 bg-amber-500/15 text-amber-300",
  Completed: "border-emerald-400/60 bg-emerald-500/15 text-emerald-300",
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function readStoredStatus(): Record<string, AssignmentStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AssignmentStatus>) : {};
  } catch {
    return {};
  }
}

function persistStatus(id: string, status: AssignmentStatus) {
  const map = readStoredStatus();
  map[id] = status;
  try {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify(map));
  } catch {
    /* storage full/blocked */
  }
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function AssignmentList() {
  const [tasks, setTasks] = useState<FieldAssignment[]>([]);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Browser GPS with a sensible fallback so distances always render offline.
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!navigator.geolocation) {
      setGps(PATNA_CENTER);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGps(PATNA_CENTER),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  }, []);

  const applyStored = useCallback(
    (data: FieldAssignment[]) => {
      const map = readStoredStatus();
      return data.map((t) => (map[t.id] ? { ...t, status: map[t.id] } : t));
    },
    [],
  );

  // DB call #1 — wrapped in try/catch; fall back to local storage + demo data.
  useEffect(() => {
    (async () => {
      try {
        const data = await listAssignments();
        setTasks(applyStored(data));
      } catch {
        setTasks(applyStored(DEMO_FALLBACK));
      } finally {
        setLoading(false);
      }
    })();
  }, [applyStored]);

  function distanceTo(taskId: string) {
    const task = tasks.find((t) => t.id === taskId);
    const origin = gps ?? PATNA_CENTER;
    return task ? formatDistance(haversineKm(origin, task)) : "—";
  }

  async function cycleStatus(task: FieldAssignment) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length];
    setSavingId(task.id);
    // Optimistic + durable local write first (always correct, even offline).
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );
    persistStatus(task.id, next);
    try {
      const updated = await updateAssignmentStatus(task.id, next);
      persistStatus(updated.id, updated.status);
      toast.success(`Task → ${next}`);
    } catch {
      // DB offline/failed → queue for replay; local storage already updated.
      OfflineSyncQueue.enqueue({
        url: "/api/assignments/status",
        method: "POST",
        body: { id: task.id, status: next },
      });
      toast(`Saved offline — queued to sync`, { icon: "⏳" });
    } finally {
      setSavingId(null);
    }
  }

  const orderByPriority = useMemo(() => {
    const rank: Record<TaskPriority, number> = { CRITICAL: 0, HIGH: 1, ROUTINE: 2 };
    return [...tasks].sort((a, b) => rank[a.priority] - rank[b.priority]);
  }, [tasks]);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wider text-cyan-300">
          My Assignments
        </h2>
        <span className="text-sm text-gray-400">{tasks.length} assigned</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#1c2740] bg-[#0d1526] p-5 text-gray-300">
          <Loader2 className="h-5 w-5 animate-spin text-amber-300" /> Loading assignments…
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {orderByPriority.map((task) => (
            <article
              key={task.id}
              className={`rounded-xl border-2 p-4 ${
                task.priority === "CRITICAL"
                  ? "border-red-500/40"
                  : task.priority === "HIGH"
                    ? "border-orange-500/30"
                    : "border-[#1c2740]"
              } bg-[#0d1526]`}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-gray-100">{task.title}</h3>
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${PRIORITY_STYLE[task.priority]}`}
                >
                  <Navigation className="h-3 w-3" />
                  {task.priority}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-cyan-300" />
                  {task.location}
                </span>
                <span className="font-semibold text-amber-300">
                  {distanceTo(task.id)}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-300">{task.instruction}</p>

              {/* 1-tap status switcher */}
              <button
                type="button"
                onClick={() => void cycleStatus(task)}
                disabled={savingId === task.id}
                className={`mt-3 flex min-h-[48px] w-full items-center justify-between rounded-lg border-2 px-4 text-base font-bold transition active:scale-95 disabled:opacity-60 ${STATUS_STYLE[task.status]}`}
                aria-label={`Status: ${task.status}. Tap to advance.`}
              >
                <span className="inline-flex items-center gap-2">
                  {task.status === "Completed" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                  {task.status}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  tap to advance
                </span>
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// Local fallback used only when the DB call (listAssignments) itself throws.
const DEMO_FALLBACK: FieldAssignment[] = [
  {
    id: "t1",
    title: "Inspect Kankarbagh Pump Station",
    priority: "CRITICAL",
    location: "Kankarbagh, Patna",
    lat: 25.5863,
    lng: 85.842,
    instruction: "Verify pump operation and report water level.",
    status: "Not Started",
  },
  {
    id: "t2",
    title: "Deliver 50 Medical Kits to District Hospital",
    priority: "HIGH",
    location: "Patliputra Road, Patna",
    lat: 25.6125,
    lng: 85.145,
    instruction: "Confirm kits with the medical officer.",
    status: "En Route",
  },
  {
    id: "t3",
    title: "Verify Flooding at Bypass Road",
    priority: "CRITICAL",
    location: "Bypass Road, Patna",
    lat: 25.5941,
    lng: 85.1376,
    instruction: "Check water depth across the culvert.",
    status: "Not Started",
  },
];
