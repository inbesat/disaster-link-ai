"use client";

import { useCallback, useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushState =
  | { status: "unsupported" }
  | { status: "unconfigured" }
  | { status: "idle" }
  | { status: "enabled" }
  | { status: "denied"; instructions: string }
  | { status: "error"; message: string };

export default function PushNotificationToggle() {
  const [state, setState] = useState<PushState>({ status: "idle" });
  const [busy, setBusy] = useState(false);

  const supportsPush =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    Boolean(VAPID_PUBLIC_KEY);

  useEffect(() => {
    if (!supportsPush) {
      setState({ status: "unsupported" });
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setState({ status: "unconfigured" });
      return;
    }

    if (typeof Notification !== "undefined" && Notification.permission === "denied") {
      setState({
        status: "denied",
        instructions: "Notifications blocked. Enable in browser site settings to receive critical disaster alerts.",
      });
      return;
    }

    setState({ status: "idle" });
  }, [supportsPush]);

  const subscribe = useCallback(async () => {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState({ status: "unsupported" });
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState({
          status: "denied",
          instructions:
            "Permission denied. To enable: Click lock icon in browser address bar -> Site settings -> Notifications -> Allow.",
        });
        return;
      }

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY as string,
          ) as unknown as BufferSource,
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        setState({ status: "error", message: "Failed to save subscription." });
        return;
      }

      setState({ status: "enabled" });
    } catch (error: unknown) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Push setup failed.",
      });
    } finally {
      setBusy(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        const endpoint = subscription.endpoint;
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
      setState({ status: "idle" });
    } catch (error: unknown) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unsubscribe failed.",
      });
    } finally {
      setBusy(false);
    }
  }, []);

  if (state.status === "unsupported") {
    return null;
  }

  const enabled = state.status === "enabled";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy || state.status === "unconfigured" || state.status === "denied"}
          onClick={enabled ? () => void unsubscribe() : () => void subscribe()}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            enabled
              ? "border-severity-green-600 bg-severity-green-600/10 text-severity-green-400 hover:bg-severity-green-600/20"
              : "border-border bg-surface-elevated text-foreground hover:border-accent hover:text-accent"
          }`}
          title={
            state.status === "unconfigured"
              ? "Browser alerts are not configured (VAPID keys missing)."
              : undefined
          }
        >
          {enabled ? "🔔 Browser alerts ON" : "🔕 Enable browser alerts"}
        </button>
        {state.status === "error" && (
          <span className="hidden text-[11px] text-severity-red-400 lg:inline">
            {state.message}
          </span>
        )}
      </div>

      {state.status === "denied" && (
        <p className="mt-1 rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-300">
          ⚠️ {state.instructions}
        </p>
      )}
    </div>
  );
}
