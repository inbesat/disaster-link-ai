"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function RefreshDataButton() {
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/cron/ingest");
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.error ?? "Refresh failed.");
      }

      toast.success(`Ingested ${data.ingested} district(s)`);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Refresh failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent disabled:opacity-50"
    >
      {loading && <Spinner />}
      {loading ? "Refreshing…" : "Force Refresh Data"}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
