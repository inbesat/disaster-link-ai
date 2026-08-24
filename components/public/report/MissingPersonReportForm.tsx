"use client";

// ---------------------------------------------------------------------
// components/public/report/MissingPersonReportForm.tsx — citizen-facing
// "Missing Person / Casualty" reporter for the public portal.
//
// Flow: tabs (Missing vs Casualty) → details + drag-and-drop photo
// (FileReader → Base64 data URL preview, ≤2 MB) → POST /api/reports/missing
// → PENDING_REVIEW in the command-center queue.
//
// Theme matches the citizen dl-* design language (navy, glass cards,
// orange accents) used across /public/*.
// ---------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";

type ReportType = "MISSING_PERSON" | "CASUALTY";

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB — matches API cap

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[0.9375rem] text-white placeholder:text-slate-500 outline-none transition focus:border-[var(--dl-orange)]/60 focus:ring-1 focus:ring-[var(--dl-orange)]/30";

const labelClass =
  "mb-1.5 block text-sm font-semibold text-white";

export function MissingPersonReportForm() {
  const [type, setType] = useState<ReportType>("MISSING_PERSON");
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Unspecified");
  const [lastSeenLocation, setLastSeenLocation] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readPhoto = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please attach an image file (JPG/PNG).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo is over 2 MB — please choose a smaller image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(typeof reader.result === "string" ? reader.result : "");
      setPhotoName(file.name);
    };
    reader.onerror = () => setError("Could not read that file — try another photo.");
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) readPhoto(file);
    },
    [readPhoto],
  );

  const clearPhoto = () => {
    setPhotoUrl("");
    setPhotoName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const resetForm = useCallback(() => {
    setFullName(""); setAge(""); setGender("Unspecified");
    setLastSeenLocation(""); setReporterName(""); setReporterPhone("");
    setMedicalNotes(""); clearPhoto(); setSubmittedId(null); setError(null);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    if (!fullName.trim() || !lastSeenLocation.trim() || !reporterName.trim() || !reporterPhone.trim()) {
      setError("Please fill in name, last seen location and your contact details.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/missing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          fullName,
          age: age.trim() === "" ? "Unknown" : Number(age) || age.trim(),
          gender,
          lastSeenLocation,
          reporterName,
          reporterPhone,
          medicalNotes,
          photoUrl,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean; error?: string; report?: { id?: string };
      };
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? `Submission failed (${res.status}).`);
      }
      setSubmittedId(body.report?.id ?? "—");
      showToast("success", {
        title: "Report sent to Command Center",
        description: "Field verification is in progress.",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong — please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──
  if (submittedId) {
    return (
      <div className="eoc-panel flex max-w-md flex-col items-center gap-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.07] p-10 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-14 w-14 text-emerald-400" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-white">Report Received</h1>
        <p className="text-sm leading-relaxed text-slate-300">
          Report submitted to Emergency Command Center. Field verification in progress.
        </p>
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-400">
          Reference: {submittedId}
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="mt-1 w-full rounded-eoc border-2 border-[var(--dl-orange)] bg-[var(--dl-orange)]/10 py-3 text-sm font-semibold text-[var(--dl-orange)] transition hover:bg-[var(--dl-orange)]/20"
        >
          File Another Report
        </button>
      </div>
    );
  }

  // ── Form ──
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Type tabs */}
      <div role="tablist" aria-label="Report type" className="grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5">
        {(
          [
            { key: "MISSING_PERSON", label: "Report Missing Person", icon: Search },
            { key: "CASUALTY", label: "Report Casualty", icon: AlertTriangle },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={type === key}
            onClick={() => setType(key)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)] ${
              type === key
                ? key === "CASUALTY"
                  ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/40"
                  : "bg-[var(--dl-orange)]/15 text-[var(--dl-orange-light)] ring-1 ring-[var(--dl-orange)]/40"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Identity */}
      <div>
        <label htmlFor="mp-name" className={labelClass}>
          {type === "CASUALTY" ? "Description of Person" : "Full Name"} *
        </label>
        <input
          id="mp-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={type === "CASUALTY" ? "e.g. Unidentified male, grey shirt" : "e.g. Ramesh Kumar Yadav"}
          required
          maxLength={200}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="mp-age" className={labelClass}>Age</label>
          <input
            id="mp-age" value={age} onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 34" inputMode="numeric" maxLength={20} className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mp-gender" className={labelClass}>Gender</label>
          <select id="mp-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
            {["Unspecified", "Female", "Male", "Other"].map((g) => (
              <option key={g} value={g} className="bg-[#0a1120]">{g}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="mp-lastseen" className={labelClass}>
          {type === "CASUALTY" ? "Location Found" : "Last Known Location"} *
        </label>
        <input
          id="mp-lastseen"
          value={lastSeenLocation}
          onChange={(e) => setLastSeenLocation(e.target.value)}
          placeholder="e.g. Gandhi Maidan shelter queue, Patna"
          required maxLength={500}
          className={inputClass}
        />
      </div>

      {/* Photo */}
      <div>
        <span className={labelClass}>Photo Attachment</span>
        {photoUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="Attached preview" className="h-52 w-full object-cover" />
            <button
              type="button" onClick={clearPhoto}
              aria-label="Remove photo"
              className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-red-500/80"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition ${
              dragOver
                ? "border-[var(--dl-orange)] bg-[var(--dl-orange)]/10"
                : "border-white/15 bg-white/5 hover:border-[var(--dl-orange)]/50"
            }`}
          >
            <ImagePlus className="h-7 w-7 text-slate-400" aria-hidden />
            <span className="text-sm font-semibold text-slate-200">
              Drag &amp; drop a photo, or tap to browse
            </span>
            <span className="text-xs text-slate-500">JPG/PNG · up to 2 MB · instant preview</span>
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) readPhoto(f); }}
            />
          </label>
        )}
        {photoName && !photoUrl && <p className="mt-1 text-xs text-slate-500">{photoName}</p>}
      </div>

      {/* Reporter */}
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="mb-3 flex items-center gap-1.5 text-sm font-bold text-white">
          <UserRound className="h-4 w-4 text-[var(--dl-blue-light)]" aria-hidden />
          Your Contact Details
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="mp-rep-name" className={labelClass}>Reporter Name *</label>
            <input id="mp-rep-name" value={reporterName} onChange={(e) => setReporterName(e.target.value)}
              placeholder="Your full name" required maxLength={200} className={inputClass} />
          </div>
          <div>
            <label htmlFor="mp-rep-phone" className={labelClass}>Verified Contact Number *</label>
            <input id="mp-rep-phone" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)}
              placeholder="+91 98765 43210" type="tel" required maxLength={30} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="mp-notes" className={labelClass}>
          Identifying Marks / Medical Notes (optional)
        </label>
        <textarea
          id="mp-notes" value={medicalNotes} onChange={(e) => setMedicalNotes(e.target.value)}
          placeholder="e.g. Scar on left wrist, diabetic, wears blue kurta…"
          rows={3} maxLength={2000} className={`${inputClass} resize-none`}
        />
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
          <X className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={`flex w-full items-center justify-center gap-2 rounded-eoc py-5 text-lg font-bold text-white transition disabled:opacity-60 ${
          type === "CASUALTY"
            ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
            : "bg-gradient-to-r from-[#ea580c] to-[#F97316] hover:from-[#dc2626] hover:to-[#fb923c]"
        }`}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Submitting…
          </>
        ) : (
          <>Send to Emergency Command Center</>
        )}
      </button>
      <p className="text-center text-xs text-slate-500">
        Life-threatening emergency? Call{" "}
        <a href="tel:112" className="font-semibold text-[var(--dl-orange-light)]">112</a> now.
      </p>
    </form>
  );
}

export default MissingPersonReportForm;
