"use client";

// ---------------------------------------------------------------------
// hooks/useOfflineTasks.ts — Phase 14 · Step 3 · Offline-first task mgmt.
//
// Field networks drop constantly, so a responder's assigned tasks must
// live on the device. This hook:
//
//   1. Seeds the responder's task list from a local cache (localStorage),
//      falling back to the demo dispatch set on first use.
//   2. Persists every status change immediately (optimistic + durable).
//   3. When "Mark Complete" fires while navigator.onLine === false, the
//      update is pushed to the pending_sync queue (reuses the shared
//      OfflineSyncQueue from lib/field-offline.ts) instead of the wire.
//   4. Subscribes to the browser 'online' event and auto-flushes the
//      queue the moment connectivity returns — no user action needed.
//
// Returns { tasks, online, pendingCount, startTask, markComplete, syncNow }.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  OfflineSyncQueue,
  isOnline,
  subscribeToNetwork,
} from "@/lib/field-offline";

export type TaskPriority = "URGENT" | "MODERATE" | "ROUTINE";

export interface FieldTask {
  id: string;
  emoji: string;
  title: string;
  location: string;
  priority: TaskPriority;
  status: "Not Started" | "En Route" | "Completed";
  dueLabel?: string; // e.g. "Due in 45 min"
  lat: number;
  lng: number;
}

const TASKS_KEY = "drip_offline_tasks_v1";
const SYNC_URL = "/api/assignments/status";

// Demo dispatch set — matches the Phase 14 brief (red/amber/green cards)
// plus a couple of routine follow-ups so the list feels alive.
const SEED_TASKS: FieldTask[] = [
  {
    id: "t1",
    emoji: "🚨",
    title: "Deliver medical supplies to Shelter X",
    location: "Central Community Hall, Patna",
    priority: "URGENT",
    status: "Not Started",
    dueLabel: "Due in 45 min",
    lat: 25.5989,
    lng: 85.1492,
  },
  {
    id: "t2",
    emoji: "📍",
    title: "Patrol Evacuation Route Y",
    location: "Bypass Road → Riverside",
    priority: "MODERATE",
    status: "En Route",
    lat: 25.6011,
    lng: 85.1382,
  },
  {
    id: "t3",
    emoji: "📋",
    title: "Verify occupancy at Shelter Z",
    location: "Riverside High School",
    priority: "ROUTINE",
    status: "Not Started",
    lat: 25.6104,
    lng: 85.1322,
  },
  {
    id: "t4",
    emoji: "🛟",
    title: "Collect rescue boat from depot",
    location: "Patliputra Depot",
    priority: "URGENT",
    status: "Completed",
    lat: 25.6125,
    lng: 85.145,
  },
];

function readCache(): FieldTask[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as FieldTask[]) : null;
  } catch {
    return null;
  }
}

function writeCache(tasks: FieldTask[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    /* storage blocked — in-memory state still works for the session */
  }
}

export function clearOfflineTasks() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TASKS_KEY);
  } catch {
    /* ignore */
  }
}

export function useOfflineTasks() {
  const [tasks, setTasks] = useState<FieldTask[]>(() => readCache() ?? SEED_TASKS);
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(OfflineSyncQueue.count());

  // Keep the local cache in sync on every change.
  useEffect(() => {
    writeCache(tasks);
  }, [tasks]);

  // Network subscription: flip the flag AND auto-flush the queue on
  // reconnect (Step 3 requirement — the banner says "Sync Paused" while
  // disconnected; nothing to tap when it comes back).
  useEffect(() => {
    const unsub = subscribeToNetwork(() => {
      const backOnline = isOnline();
      setOnline(backOnline);
      if (backOnline) void syncNow();
    });
    const onQueue = () => setPendingCount(OfflineSyncQueue.count());
    window.addEventListener("drip:pending", onQueue);
    window.addEventListener("storage", onQueue);
    return () => {
      unsub();
      window.removeEventListener("drip:pending", onQueue);
      window.removeEventListener("storage", onQueue);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncNow = useCallback(async () => {
    const res = await OfflineSyncQueue.syncAll();
    setPendingCount(res.remaining);
    return res;
  }, []);

  const advance = useCallback(
    (id: string, next: FieldTask["status"]) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));

      if (isOnline()) {
        // Straight to the wire; on failure fall through to the queue.
        fetch(SYNC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: next }),
        }).catch(() => {
          OfflineSyncQueue.enqueue({ url: SYNC_URL, method: "POST", body: { id, status: next } });
          setPendingCount(OfflineSyncQueue.count());
        });
      } else {
        // Offline → stash in pending_sync; auto-flush on 'online'.
        OfflineSyncQueue.enqueue({ url: SYNC_URL, method: "POST", body: { id, status: next } });
        setPendingCount(OfflineSyncQueue.count());
      }
    },
    [],
  );

  const startTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || task.status !== "Not Started") return;
      advance(id, "En Route");
    },
    [tasks, advance],
  );

  const markComplete = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || task.status === "Completed") return;
      advance(id, "Completed");
    },
    [tasks, advance],
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter((t) => t.status === "Completed").length,
      inProgress: tasks.filter((t) => t.status === "En Route").length,
    }),
    [tasks],
  );

  return { tasks, online, pendingCount, startTask, markComplete, syncNow, stats };
}

export default useOfflineTasks;
