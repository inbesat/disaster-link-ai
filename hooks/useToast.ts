// ---------------------------------------------------------------------
// hooks/useToast.ts
// UI/UX Phase 1 · Step 7 — severity-based toast API.
//
// Thin client wrapper around the custom toast renderer in
// components/ui/Toast.tsx. Each helper returns the toast id so callers
// can replace (`id`) or dismiss (`dismiss(id)`) individual toasts.
//
//   const toast = useToast();
//   toast.success({ title: "Shelter updated", description: "32 beds freed" });
//   toast.error({ title: "Sync failed" });
//   toast.warning({ title: "Sector 4 — water rising", duration: 8000 });
// ---------------------------------------------------------------------

"use client";

import { useCallback } from "react";
import {
  dismissAllToasts,
  dismissToast,
  showToast,
  type ToastOptions,
  type ToastSeverity,
} from "@/components/ui/Toast";

export type { ToastOptions, ToastSeverity };

export type UseToast = {
  success: (options: ToastOptions) => string;
  warning: (options: ToastOptions) => string;
  error: (options: ToastOptions) => string;
  info: (options: ToastOptions) => string;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
};

/**
 * Severity-based toast helpers backed by the roadmap-styled custom card.
 * The returned functions are stable (useCallback), safe to destructure.
 */
export function useToast(): UseToast {
  const success = useCallback(
    (options: ToastOptions) => showToast("success", options),
    [],
  );
  const warning = useCallback(
    (options: ToastOptions) => showToast("warning", options),
    [],
  );
  const error = useCallback((options: ToastOptions) => showToast("error", options), []);
  const info = useCallback((options: ToastOptions) => showToast("info", options), []);
  const dismiss = useCallback((id?: string) => dismissToast(id), []);
  const dismissAll = useCallback(() => dismissAllToasts(), []);

  return { success, warning, error, info, dismiss, dismissAll };
}

export default useToast;
