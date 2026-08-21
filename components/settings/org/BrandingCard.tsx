"use client";

// ---------------------------------------------------------------------
// components/settings/org/BrandingCard.tsx — Organization (Phase 5 · Step 9).
//
// White-labeling capabilities:
//   • Logo upload zone (drag & drop or browse) with preview + remove.
//   • Footer legal text area for exported documents.
//   • Explainer: logo + text are auto-embedded into exported PDF SitReps
//     and Dispatch Manifests.
// ---------------------------------------------------------------------

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Image as ImageIcon, Save, X } from "lucide-react";

const DEFAULT_LEGAL_TEXT =
  "CONFIDENTIAL: NDRF Internal Operations Use Only";

export default function BrandingCard() {
  const [logoName, setLogoName] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [legalText, setLegalText] = useState(DEFAULT_LEGAL_TEXT);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Logo upload must be an image (PNG, SVG, JPG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo is too large — keep it under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setLogoName(file.name);
    toast.success(`Logo "${file.name}" staged for branding.`);
  }

  function removeLogo() {
    setLogoName(null);
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast("Logo removed — exports will fall back to the generic header.", {
      duration: 2500,
    });
  }

  function handleSave() {
    if (!logoName && !legalText.trim()) {
      toast.error("Add a logo or legal text before saving.");
      return;
    }
    toast.success("Branding saved — applied to all future exports.", {
      duration: 3000,
    });
  }

  return (
    <section
      data-settings-key="org-branding"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <ImageIcon className="h-5 w-5 text-violet-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-violet-300/80">BRANDING</p>
          <h2 className="mt-0.5 text-lg font-bold">
            Organization Branding &amp; Exports
          </h2>
        </div>
      </div>

      {/* Logo upload zone */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400">
          AGENCY LOGO
        </p>

        {logoPreview ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-violet-400/40 bg-violet-500/[0.06] px-3 py-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoPreview}
                alt="Agency logo preview"
                className="h-12 w-12 shrink-0 rounded-md border border-panel-border object-contain bg-[#0a0f1a]"
              />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {logoName}
                </p>
                <p className="text-[11px] text-slate-500">
                  Will appear in the SitRep header on every export.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-violet-400/40 px-2.5 py-1.5 text-[11px] font-semibold text-violet-200 transition hover:bg-violet-500/10"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={removeLogo}
                aria-label="Remove logo"
                className="rounded-md border border-panel-border p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files[0]);
            }}
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-8 text-center transition ${
              dragOver
                ? "border-violet-400 bg-violet-500/10"
                : "border-panel-border bg-[#0a0f1a] hover:border-violet-400/40"
            }`}
          >
            <ImageIcon className="h-6 w-6 text-slate-500" aria-hidden />
            <span className="text-xs font-semibold text-slate-300">
              Drop your logo here or{" "}
              <span className="text-violet-300">browse</span>
            </span>
            <span className="text-[11px] text-slate-500">
              PNG, SVG or JPG · max 2 MB · transparent backgrounds preferred
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {/* Footer legal text */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold tracking-wide text-slate-400">
          FOOTER LEGAL TEXT
        </p>
        <textarea
          value={legalText}
          onChange={(e) => setLegalText(e.target.value)}
          rows={3}
          placeholder="e.g. CONFIDENTIAL: NDRF Internal Operations Use Only"
          className="mt-2 w-full rounded-md border border-panel-border bg-[#0a0f1a] px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-400/60"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            {legalText.trim().length} chars · shown at the bottom of every page
          </p>
          <p className="text-[11px] text-slate-600">
            Tip: keep it under 200 characters for clean PDF wrapping.
          </p>
        </div>
      </div>

      {/* Export embed explainer */}
      <div className="mt-5 flex items-start gap-3 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-400">
          This logo and legal text will be{" "}
          <span className="font-semibold text-slate-200">
            automatically embedded into all exported PDF Situation Reports
            (SitReps) and Dispatch Manifests
          </span>
          . The logo renders in the header, the legal text in the footer of
          every page.
        </p>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-violet-400/50 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-200 transition hover:bg-violet-500/20"
      >
        <Save className="h-4 w-4" aria-hidden />
        Save Branding
      </button>
    </section>
  );
}