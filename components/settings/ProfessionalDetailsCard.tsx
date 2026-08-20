"use client";

// ---------------------------------------------------------------------
// components/settings/ProfessionalDetailsCard.tsx — Settings · Phase 4.
//
// Government / NGO credentials section shown on /settings/profile:
//   • Credentials row — organization name, department, employee/badge ID
//     and a green "Government Verified Responder" status badge.
//   • Uploaded certifications — verified credentials (green) with expiry,
//     plus freshly uploaded ones flagged amber "In Review".
//   • "+ Upload New Certification" — accepts PDF / PNG / JPG / WEBP files
//     and appends them to the list in the In-Review state.
//
// Persistence uses localStorage (offline-first, matching the ProfileForm
// fallback) since certifications have no DB table yet — toasts confirm
// every action.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  FileImage,
  Loader2,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { initialsFor } from "@/lib/settings/avatar";

const PROF_DETAILS_KEY = "drip_professional_details_v1";
const CERTS_KEY = "drip_uploaded_certs_v1";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB source cap

type Certification = {
  id: string;
  name: string;
  status: "verified" | "in_review";
  validUntil?: string;
  uploadedAt: string;
  fileName?: string;
};

const MOCK_CERTIFICATIONS: Certification[] = [
  {
    id: "c-ndma",
    name: "NDMA Advanced Disaster Management",
    status: "verified",
    validUntil: "2028",
    uploadedAt: "2024-03-15",
  },
  {
    id: "c-firstaid",
    name: "Certified First-Aid Responder",
    status: "verified",
    validUntil: "2027",
    uploadedAt: "2024-01-20",
  },
];

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / unavailable — skip persistence, keep in-memory state
  }
}

export default function ProfessionalDetailsCard() {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Credentials — read the persisted snapshot once mounted (defaults baked
  // in keep SSR/hydration deterministic).
  const [orgName, setOrgName] = useState("National Disaster Response Force");
  const [department, setDepartment] = useState("Flood Operations Wing");
  const [employeeId, setEmployeeId] = useState("NDRF-PAT-2024-1187");
  const [certs, setCerts] = useState<Certification[]>(MOCK_CERTIFICATIONS);

  useEffect(() => {
    const snap = readJson<{ orgName?: string; department?: string; employeeId?: string }>(
      PROF_DETAILS_KEY,
    );
    setOrgName((prev) => snap?.orgName ?? prev);
    setDepartment((prev) => snap?.department ?? prev);
    setEmployeeId((prev) => snap?.employeeId ?? prev);
    const savedCerts = readJson<Certification[]>(CERTS_KEY);
    if (savedCerts) setCerts(savedCerts);
  }, []);

  function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      writeJson(PROF_DETAILS_KEY, { orgName, department, employeeId });
      toast.success("Professional details saved locally!");
    } catch {
      toast.error("Could not save professional details.");
    } finally {
      setSaving(false);
    }
  }

  function handleCertPicked(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please choose a PDF, PNG, JPG or WEBP file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File is too large — please use one under 8 MB.");
      return;
    }

    setUploading(true);
    try {
      const name =
        file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() ||
        "Certification Document";
      const cert: Certification = {
        id: `c-${Date.now()}`,
        name,
        status: "in_review",
        uploadedAt: new Date().toISOString().slice(0, 10),
        fileName: file.name,
      };
      const next = [cert, ...certs];
      setCerts(next);
      writeJson(CERTS_KEY, next);
      toast.success("Certification uploaded — pending review.");
    } catch {
      toast.error("Could not process the file.");
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveCert(id: string) {
    const next = certs.filter((c) => c.id !== id);
    setCerts(next);
    writeJson(CERTS_KEY, next);
    toast.success("Certification removed.");
  }

  const inputClass =
    "w-full rounded-md border border-panel-borderHover bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none";
  const labelClass = "eoc-label block mb-1.5 text-slate-400";

  return (
    <div className="space-y-5" data-settings-key="professional-details">
      {/* Credentials + Verification Status */}
      <section className="rounded-eoc border border-panel-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden />
            </div>
            <div>
              <p className="eoc-label text-amber-400/80">PROFESSIONAL DETAILS</p>
              <h2 className="mt-0.5 text-lg font-bold">Organization Credentials</h2>
            </div>
          </div>

          {/* Green verification badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-severity-green-500/40 bg-severity-green-500/10 px-3 py-1.5 text-xs font-semibold text-severity-green-400">
            <BadgeCheck className="h-4 w-4" aria-hidden />
            Government Verified Responder
          </span>
        </div>

        <form onSubmit={handleSaveDetails} className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="orgName" className={labelClass}>
                Organization Name
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. National Disaster Response Force"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="department" className={labelClass}>
                Department
              </label>
              <input
                id="department"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Flood Operations Wing"
                className={inputClass}
              />
            </div>
          </div>

          <div className="sm:max-w-xs">
            <label htmlFor="employeeId" className={labelClass}>
              Employee ID / Badge Number
            </label>
            <div className="flex items-center gap-3">
              <input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="NDRF-PAT-2024-0000"
                className={`${inputClass} font-mono uppercase`}
              />
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
                On File
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Used to confirm your responder identity with district command.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-glow-accent transition hover:bg-cyan-400 active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <BadgeCheck className="h-4 w-4" aria-hidden />
                  Save Details
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Uploaded Certifications */}
      <section className="rounded-e border border-panel-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eoc-label text-cyan-400/80">UPLOADED CERTIFICATIONS</p>
            <h2 className="mt-0.5 text-lg font-bold">Credentials on Record</h2>
            <p className="mt-1 text-sm text-slate-400">
              Verified documents are trusted by the command center. New uploads
              sit in review until an admin confirms them.
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden />
                + Upload New Certification
              </>
            )}
          </button>
        </div>

        <ul className="mt-5 space-y-3">
          {certs.length === 0 ? (
            <li className="rounded-md border border-dashed border-panel-borderHover px-4 py-6 text-center text-sm text-slate-500">
              No certifications on record yet. Upload one to get started.
            </li>
          ) : (
            certs.map((cert) => (
              <li
                key={cert.id}
                className="flex items-center gap-4 rounded-md border border-panel-border bg-surface-muted/40 px-4 py-3.5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                  {cert.status === "verified" ? (
                    <BadgeCheck className="h-5 w-5 text-severity-green-400" aria-hidden />
                  ) : (
                    <span
                      className="flex h-5 w-5 items-center justify-center text-[10px] font-bold text-cyan-300"
                      aria-hidden="true"
                    >
                      {initialsFor(cert.fileName ?? cert.name)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="truncate text-sm font-semibold">{cert.name}</p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        cert.status === "verified"
                          ? "border border-severity-green-500/40 bg-severity-green-500/10 text-severity-green-400"
                          : "border border-severity-amber-500/40 bg-severity-amber-500/10 text-severity-amber-400"
                      }`}
                    >
                      {cert.status === "verified" ? "Verified" : "In Review"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {cert.status === "verified" && cert.validUntil
                      ? `Valid till ${cert.validUntil}`
                      : `Uploaded ${cert.uploadedAt}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveCert(cert.id)}
                  className="rounded-md p-1.5 text-slate-500 transition hover:bg-severity-red-600/10 hover:text-severity-red-400"
                  aria-label={`Remove ${cert.name}`}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>

        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <FileImage className="h-3.5 w-3.5" aria-hidden />
          Accepts PDF, PNG, JPG and WEBP — up to 8 MB per document.
        </p>
      </section>

      {/* Hidden file input — triggered by the upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          handleCertPicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}