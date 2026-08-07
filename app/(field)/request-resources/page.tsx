"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { submitResourceRequest } from "@/app/actions/resources";

const CATEGORIES = [
  "boat",
  "food",
  "medical",
  "water",
  "personnel",
  "vehicle",
  "communication",
  "power",
  "other",
];

const URGENCY_STYLES: Record<string, string> = {
  high: "border-severity-amber-500 bg-severity-amber-600/20 text-severity-amber-400",
  critical: "border-severity-red-500 bg-severity-red-600/20 text-severity-red-400",
};

export default function RequestResourcesPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [quantity, setQuantity] = useState("");
  const [urgency, setUrgency] = useState<"high" | "critical">("high");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);

  function useGps() {
    if (!("geolocation" in navigator)) {
      toast.error("GPS not available on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location captured.");
      },
      () => {
        setLocating(false);
        toast.error("Could not get location. Please enable GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    if (!coords) {
      toast.error("Tap “Use Current GPS Location” first.");
      return;
    }
    setSending(true);
    const result = await submitResourceRequest({
      category,
      quantity: qty,
      urgency,
      lat: coords.lat,
      lng: coords.lng,
    });
    setSending(false);
    if (result.ok) {
      toast.success("Request sent to Command Center.");
      setQuantity("");
      setUrgency("high");
      setCoords(null);
    } else {
      toast.error("Request failed. Please retry.");
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center bg-background px-4 py-6">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-5">
        <header>
          <p className="eoc-label text-accent">FIELD RESPONDER</p>
          <h1 className="mt-1 text-2xl font-bold">Request Backup</h1>
          <p className="mt-1 text-sm text-slate-400">
            Ask Command Center for resources at your location.
          </p>
        </header>

        {/* Resource category */}
        <label htmlFor="category-select" className="eoc-label block">
          RESOURCE CATEGORY
        </label>
        <select
          id="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border-2 border-border bg-surface px-4 py-4 text-base font-semibold text-foreground focus:border-accent focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>

        {/* Quantity */}
        <label htmlFor="quantity-input" className="eoc-label block">
          QUANTITY NEEDED
        </label>
        <input
          id="quantity-input"
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="e.g. 6"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full rounded-xl border-2 border-border bg-surface px-4 py-4 text-2xl font-bold text-foreground focus:border-accent focus:outline-none"
        />

        {/* Urgency toggle */}
        <fieldset>
          <legend className="eoc-label mb-2">URGENCY</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["high", "critical"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUrgency(u)}
                aria-pressed={urgency === u}
                className={`rounded-xl border-2 px-4 py-4 text-base font-bold uppercase tracking-wider transition active:scale-95 ${
                  urgency === u
                    ? URGENCY_STYLES[u]
                    : "border-border bg-surface text-slate-400"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </fieldset>

        {/* GPS */}
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          className="flex h-16 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent/60 bg-accent/10 px-4 py-4 text-base font-bold text-accent transition active:scale-95 disabled:opacity-50"
        >
          <span aria-hidden>📍</span>
          {locating ? "Locating…" : coords ? "GPS Locked" : "Use Current GPS Location"}
        </button>
        {coords && (
          <p className="-mt-3 text-center font-mono text-xs text-slate-400">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={sending}
          className="mt-2 h-16 rounded-xl bg-accent px-4 py-4 text-base font-black uppercase tracking-wider text-slate-950 shadow-glow transition hover:bg-sky-300 active:scale-95 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send Request"}
        </button>
      </form>
    </main>
  );
}
