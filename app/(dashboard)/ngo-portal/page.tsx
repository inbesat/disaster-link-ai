"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/ngo-portal/page.tsx — NGO Donation Management.
//
// Renders inside the auth-protected (dashboard) layout's DashboardShell.
// Demo surface for the Verified NGO Donation feature: a green
// "Verified by District Administration" status card on top, plus a
// Donation QR upload card whose "Upload QR" button simulates a ~1s
// upload (spinner) and then surfaces a dummy UPI QR placeholder. No
// backend persistence — the demo flow is intentionally mock.
// ---------------------------------------------------------------------

import { useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import {
  BadgeCheck,
  HeartHandshake,
  ImagePlus,
  Loader2,
  QrCode,
  ShieldCheck,
  Upload,
} from "lucide-react";

// Demo placeholder — a real upload would store the file in Supabase
// Storage and write the public URL to users.donation_qr_url.
const MOCK_QR_URL =
  "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MockUPI";

export default function NgoPortalPage() {
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
    // Mock a ~1s upload, then surface the QR.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setQrLive(true);
    setUploading(false);
  }

  return (
    <section className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <HeartHandshake className="h-5 w-5 text-accent" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-bold text-primary sm:text-2xl">
            NGO Donation Management
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Upload your donation QR code and track your verification status.
          </p>
        </div>
      </div>

      {/* Verification status — mock 'verified' for the demo. */}
      <div className="eoc-panel flex items-center gap-4 border-severity-green-500/30 p-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-severity-green-500/15">
          <BadgeCheck className="h-6 w-6 text-severity-green-400" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-severity-green-400">
            ✅ Verified by District Administration
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Registration No. NGO/2024/DR/001142 · donations enabled
          </p>
        </div>
      </div>

      {/* Donation QR upload card */}
      <div className="eoc-panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <QrCode className="h-5 w-5 text-accent" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-primary">
              Donation QR Code
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Upload a UPI / donation QR so citizens can contribute directly
              to your relief work.
            </p>
          </div>
        </div>

        {/* Drop zone + hidden file input */}
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
          className={`flex flex-col items-center justify-center rounded-eoc border border-dashed px-6 py-10 text-center transition-colors ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border bg-surface-muted/40 hover:border-accent/60 hover:bg-surface-muted"
          }`}
        >
          <ImagePlus className="h-8 w-8 text-muted" aria-hidden />
          <p className="mt-3 text-sm text-primary">
            {selectedFile
              ? `Selected: ${selectedFile}`
              : "Drag & drop your QR code image here, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted">
            PNG, JPG or WebP · a square image works best
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => pickFile(event.target.files)}
          />
        </div>

        {/* Upload action */}
        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="mt-5 flex flex-col items-center gap-3 rounded-eoc border border-severity-green-500/30 bg-severity-green-500/5 p-6">
            <Image
              src={MOCK_QR_URL}
              alt="Mock UPI donation QR code"
              width={144}
              height={144}
              className="h-36 w-36 rounded-lg bg-white p-2"
            />
            <p className="flex items-center gap-1.5 text-xs font-medium text-severity-green-400">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Donation QR is live — citizens can now scan and contribute.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
