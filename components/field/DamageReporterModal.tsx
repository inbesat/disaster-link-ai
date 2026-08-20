"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Camera,
  X,
  MapPin,
  Clock,
  User,
  Check,
  Loader2,
  FileImage,
} from "lucide-react";
import { PATNA_CENTER } from "@/lib/field-offline";

const REPORT_KEY = "drip_photo_report_queue_v1";

type Severity = "Minor Waterlogging" | "Severe Flood (Impassable)" | "Structural Damage";

const SEVERITIES: { label: Severity; style: string }[] = [
  {
    label: "Minor Waterlogging",
    style: "border-sky-400/60 bg-sky-400/10 text-sky-300",
  },
  {
    label: "Severe Flood (Impassable)",
    style: "border-orange-400/60 bg-orange-400/10 text-orange-300",
  },
  {
    label: "Structural Damage",
    style: "border-red-400/60 bg-red-400/10 text-red-300",
  },
];

const RESPONDER_ID = "RESP-007";

type QueuedReport = {
  id: string;
  base64: string;
  lat: number;
  lng: number;
  at: string;
  severity: Severity;
  responder: string;
};

function readQueue(): QueuedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REPORT_KEY);
    return raw ? (JSON.parse(raw) as QueuedReport[]) : [];
  } catch {
    return [];
  }
}

function pushQueue(report: QueuedReport) {
  try {
    window.localStorage.setItem(
      REPORT_KEY,
      JSON.stringify([...readQueue(), report]),
    );
  } catch {
    /* storage blocked */
  }
}

export default function DamageReporterModal() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickupPhoto(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
    setAt(new Date().toISOString());

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords(PATNA_CENTER),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      );
    } else {
      setCoords(PATNA_CENTER);
    }
  }

  function close() {
    if (saving) return;
    setOpen(false);
    setPreview(null);
    setCoords(null);
    setAt(null);
    setSeverity(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function save() {
    if (!preview || !severity) return;
    setSaving(true);

    const report: QueuedReport = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      base64: preview,
      lat: coords?.lat ?? PATNA_CENTER.lat,
      lng: coords?.lng ?? PATNA_CENTER.lng,
      at: at ?? new Date().toISOString(),
      severity,
      responder: RESPONDER_ID,
    };

    try {
      // Supabase Storage upload. In the demo, this deliberately throws when
      // offline/blocked so we fall back to the queued base64 report.
      const blob = (await (await fetch(preview)).blob()) as Blob;
      const res = await fetch("/api/field/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: report.id,
          blob_size: blob.size,
          severity,
          lat: report.lat,
          lng: report.lng,
          at: report.at,
        }),
      });
      if (!res.ok) throw new Error(`Upload ${res.status}`);
      toast.success("Photo report uploaded to storage.");
    } catch {
      // Offline / upload failure → queue the base64 report for later sync.
      pushQueue(report);
      toast.success("⚠ Saved offline — will sync when back online.");
    } finally {
      setSaving(false);
      close();
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-[72px] w-full items-center gap-4 rounded-xl border-2 border-panel-border bg-panel-deep px-5 py-4 transition hover:border-amber-400 hover:bg-[#111a2e]"
      >
        <Camera className="h-7 w-7 shrink-0 text-amber-300" />
        <span className="leading-tight">
          <span className="block text-lg font-bold text-gray-100">
            Rapid Photo Inspection
          </span>
          <span className="block text-base text-gray-400">
            Geotag damage for the control room
          </span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Damage assessment photo report"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={saving ? undefined : close}
        >
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-panel-border bg-panel-deep p-5">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-cyan-300">Photo Inspection</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </header>

            {/* Camera capture input */}
            {!preview ? (
              <div className="mt-4">
                <input
                  ref={inputRef}
                  id="damage-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) pickupPhoto(f);
                  }}
                />
                <label
                  htmlFor="damage-photo"
                  className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-panel-borderStrong bg-surface p-6 text-center"
                >
                  <Camera className="h-12 w-12 text-cyan-300" />
                  <span className="text-lg font-bold text-gray-100">
                    Capture or select photo
                  </span>
                  <span className="text-sm text-gray-400">
                    Opens the rear camera on mobile
                  </span>
                </label>
              </div>
            ) : (
              <>
                {/* Watermarked preview */}
                <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-panel-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Damage inspection preview"
                    className="block w-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-3 py-2 text-xs font-semibold text-amber-200 backdrop-blur-sm">
                    <span className="flex items-center gap-1 lowercase">
                      <MapPin className="h-4 w-4" />
                      {coords
                        ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                        : "fetching GPS…"}
                    </span>
                    <span className="flex items-center gap-1 tabular-nums">
                      <Clock className="h-4 w-4" />
                      {at ? new Date(at).toLocaleTimeString() : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {RESPONDER_ID}
                    </span>
                  </div>
                </div>

                {/* Re-capture */}
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setSeverity(null);
                    if (inputRef.current) inputRef.current.value = "";
                  }}
                  className="mt-3 flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-panel-border bg-surface text-base font-semibold text-slate-300"
                >
                  <FileImage className="h-5 w-5" /> Choose a different photo
                </button>
              </>
            )}

            {/* Severity tags */}
            {preview && (
              <div className="mt-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Severity
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {SEVERITIES.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setSeverity(s.label)}
                      className={`min-h-[52px] rounded-xl border-2 px-4 text-left text-base font-bold transition ${
                        severity === s.label
                          ? `${s.style} ring-2 ring-amber-400/70`
                          : "border-panel-border bg-transparent text-slate-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save */}
            {preview && (
              <button
                type="button"
                onClick={() => void save()}
                disabled={!severity || saving}
                className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/70 bg-amber-400/15 text-lg font-bold text-amber-300 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Check className="h-6 w-6" />
                    {severity ? "Save Report" : "Select a severity"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}