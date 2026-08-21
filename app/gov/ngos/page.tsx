"use client";

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  ExternalLink,
  HeartHandshake,
  ImagePlus,
  Loader2,
  QrCode,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------
// app/gov/ngos/page.tsx — NGO Coordination Portal
//
// Dark-mode gov portal for NGO donation management and coordination.
// Matches the gov dashboard theme: bg-[#0a0f1a] page bg,
// bg-[#111827] cards, blue focus rings, border-white/10.
// ---------------------------------------------------------------------

const MOCK_QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MockUPI";

/** Mock registered NGOs for the demo. */
const REGISTERED_NGOS = [
  { name: "SEEDS India", regNo: "NGO/2024/DR/001142", verified: true, donations: 47 },
  { name: "SaveTheChildren Bihar", regNo: "NGO/2024/DR/002087", verified: true, donations: 23 },
  { name: "Local Relief Corps", regNo: "NGO/2024/DR/003491", verified: false, donations: 0 },
];

export default function NgosPage() {
  const [uploading, setUploading] = useState(false);
  const [qrLive, setQrLive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function pickFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setSelectedFile(file.name);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    pickFile(event.dataTransfer.files);
  }

  async function handleUpload() {
    if (uploading) return;
    setUploading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setQrLive(true);
    setUploading(false);
  }

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <HeartHandshake className="h-5 w-5 text-emerald-400" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                NGO Donation Management
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                Manage donation QR codes and track NGO verification status
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {/* ── Stats Row ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-slate-400" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Registered NGOs
              </p>
            </div>
            <p className="mt-2 font-mono text-3xl font-bold text-white">
              {REGISTERED_NGOS.length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <div className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-emerald-400" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Verified
              </p>
            </div>
            <p className="mt-2 font-mono text-3xl font-bold text-emerald-400">
              {REGISTERED_NGOS.filter((n) => n.verified).length}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5 sm:col-span-1">
            <div className="flex items-center gap-2">
              <HeartHandshake size={18} className="text-amber-400" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Donations
              </p>
            </div>
            <p className="mt-2 font-mono text-3xl font-bold text-amber-400">
              {REGISTERED_NGOS.reduce((sum, n) => sum + n.donations, 0)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left column: QR upload + Verification ────────────────── */}
          <div className="space-y-6 lg:col-span-1">
            {/* Verification badge */}
            <div className="rounded-xl border border-emerald-500/20 bg-[#111827] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <BadgeCheck className="h-6 w-6 text-emerald-400" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    ✅ Verified by District Administration
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Registration No. NGO/2024/DR/001142 · donations enabled
                  </p>
                </div>
              </div>
            </div>

            {/* Donation QR upload card */}
            <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
              <div className="mb-4 flex items-center gap-3">
                <QrCode className="h-5 w-5 text-blue-400" aria-hidden />
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Donation QR Code
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Upload a UPI / donation QR so citizens can contribute
                  </p>
                </div>
              </div>

              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-500/5"
                    : "border-white/10 bg-[#0a0f1a]/60 hover:border-white/20"
                }`}
              >
                <ImagePlus className="h-8 w-8 text-slate-500" aria-hidden />
                <p className="mt-3 text-sm text-slate-300">
                  {selectedFile
                    ? `Selected: ${selectedFile}`
                    : "Drag & drop QR code here, or click"}
                </p>
                <p className="mt-1 text-[10px] text-slate-600">
                  PNG, JPG or WebP · square image works best
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => pickFile(event.target.files)}
                />
              </div>

              {/* Upload button */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={uploading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" aria-hidden />
                      Upload QR
                    </>
                  )}
                </button>
              </div>

              {/* QR result */}
              {qrLive && (
                <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
                  <Image
                    src={MOCK_QR_URL}
                    alt="Mock UPI donation QR code"
                    width={144}
                    height={144}
                    className="h-36 w-36 rounded-lg bg-white p-2"
                  />
                  <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    Donation QR is live — citizens can scan and contribute.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: Registered NGOs table ──────────────────── */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/10 bg-[#111827]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-sm font-semibold text-white">
                  Registered NGOs
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Organizations registered for disaster response coordination
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-3">Organization</th>
                      <th className="px-5 py-3">Registration No.</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Donations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {REGISTERED_NGOS.map((ngo) => (
                      <tr
                        key={ngo.regNo}
                        className="transition hover:bg-white/[0.02]"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
                              <HeartHandshake
                                size={16}
                                className="text-emerald-400"
                              />
                            </div>
                            <div>
                              <p className="font-medium text-white">{ngo.name}</p>
                              <p className="text-xs text-slate-500">{ngo.regNo}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                          {ngo.regNo}
                        </td>
                        <td className="px-5 py-3.5">
                          {ngo.verified ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                              <BadgeCheck size={12} />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-sm text-slate-300">
                          {ngo.donations}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/10 px-5 py-2.5 text-xs text-slate-600">
                {REGISTERED_NGOS.length} organizations registered
              </div>
            </div>

            {/* Open Data Export card */}
            <div className="mt-6 rounded-xl border border-white/10 bg-[#111827] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Open Data Export
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Export sanitized shelter and resource data for NGO partners.
                    Privacy-scrubbed per DPDP Act 2023.
                  </p>
                </div>
                <a
                  href="/api/gov/export/opendata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-[#0a0f1a] px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
                >
                  <ExternalLink size={12} />
                  Export GeoJSON
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
