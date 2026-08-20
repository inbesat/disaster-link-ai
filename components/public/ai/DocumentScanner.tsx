"use client";

// ---------------------------------------------------------------------
// components/public/ai/DocumentScanner.tsx — Phase 6 · Step 9 · Local OCR
// Document Scanner.
//
// Citizens need digital copies of their Aadhaar/ID cards if the physical
// ones are washed away. Cloud OCR costs money and needs internet — so the
// scan runs 100% on the device:
//
//     npm install tesseract.js          ← real engine (browser-side, free)
//
//   • The UI opens the device camera (mobile) or file picker (desktop)
//     to capture an ID card image.
//   • "Scan Document" runs mockOcrRecognize() — the mock stands in for
//     `Tesseract.recognize(image, "eng+hin")`, proving the whole flow
//     with zero API cost and zero internet.
//   • The success state shows the extracted fields (name, masked number,
//     DOB) with a confidence score; "Save Scanned ID" persists them to
//     localStorage (readScannedId/writeScannedId) so the digital copy
//     survives reloads — and privacy stays on the phone.
//
// Rendered as a modal driven by `open`/`onClose` (mounted inside the
// Nova sheet, triggered by the composer's scan button).
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Loader2, ScanLine, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { showToast } from "@/components/ui/Toast";
import { triggerLightHaptic } from "@/hooks/useHaptics";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import {
  mockOcrRecognize,
  writeScannedId,
  type OcrResult,
} from "@/lib/mock-data/document-scanner";

/** Simulated recognition time — lets the spinner breathe like real OCR. */
const SCAN_MS = 1600;

type Stage = "idle" | "captured" | "scanning" | "success" | "saved";

type DocumentScannerProps = {
  open: boolean;
  onClose: () => void;
};

export function DocumentScanner({ open, onClose }: DocumentScannerProps) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scanTimerRef = useRef<number | null>(null);

  // Reset the flow whenever the modal opens; Esc closes it. Focus lands in
  // the panel so keyboard users don't get dropped on the page behind.
  useEffect(() => {
    if (!open) return;
    setStage("idle");
    setPreview(null);
    setResult(null);
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clear any pending mock-scan timer on unmount.
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
    };
  }, []);

  const handleClose = () => {
    if (scanTimerRef.current) window.clearTimeout(scanTimerRef.current);
    onClose();
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(String(reader.result));
      setStage("captured");
      triggerLightHaptic();
    };
    reader.readAsDataURL(file);
  };

  const runScan = () => {
    if (!preview) return;
    triggerLightHaptic();
    setStage("scanning");
    // The mock stands in for Tesseract.recognize() — same flow, zero cost.
    scanTimerRef.current = window.setTimeout(() => {
      setResult(mockOcrRecognize(preview));
      setStage("success");
    }, SCAN_MS);
  };

  const saveId = () => {
    if (!result) return;
    writeScannedId(result.fields);
    triggerLightHaptic();
    showToast("success", {
      title: t("scan_saved"),
      description: t("scan_saved_desc"),
    });
    setStage("saved");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t("scan_title")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
          className="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 p-4 sm:items-center"
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,#12314a_0%,#0a1d30_100%)] shadow-[0_-16px_60px_rgba(0,0,0,0.55)] outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 pt-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1e4a39] ring-1 ring-[#dcf8c6]/25">
                  <ScanLine className="h-4 w-4 text-severity-green-300" strokeWidth={2.1} aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{t("scan_title")}</p>
                  <p className="text-[0.6875rem] text-[var(--dl-text-muted)]">{t("scan_subtitle")}</p>
                </div>
              </div>
              <IconButton label={t("scan_close")} variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" aria-hidden />
              </IconButton>
            </div>

            {/* Body */}
            <div className="px-4 pb-5 pt-4">
              {/* IDLE — upload / capture */}
              {stage === "idle" && (
                <div className="space-y-3">
                  <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 px-6 py-10 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-severity-green-400/15 ring-1 ring-severity-green-400/30">
                      <FileText className="h-7 w-7 text-severity-green-300" strokeWidth={1.8} aria-hidden />
                    </span>
                    <p className="text-sm leading-relaxed text-[#a9bccf]">
                      {t("scan_local_note")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cameraRef.current?.click()}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#0d9488] text-sm font-bold text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400"
                  >
                    <ScanLine className="h-4 w-4" aria-hidden />
                    {t("scan_take_photo")}
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-[#cfe0f2] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400"
                  >
                    <FileText className="h-4 w-4" aria-hidden />
                    {t("scan_choose_file")}
                  </button>

                  {/* Hidden inputs — capture="environment" opens the rear
                      camera on phones; the plain input is the gallery. */}
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                      e.target.value = "";
                    }}
                  />
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}

              {/* CAPTURED — preview + scan */}
              {stage === "captured" && preview && (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl border border-white/15">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={t("scan_title")}
                      className="max-h-56 w-full object-cover"
                    />
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <ScanLine className="h-10 w-10 text-white/50" strokeWidth={1.4} aria-hidden />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={runScan}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#0d9488] text-sm font-bold text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400"
                  >
                    <ScanLine className="h-4 w-4" aria-hidden />
                    {t("scan_scan_button")}
                  </button>
                </div>
              )}

              {/* SCANNING — local OCR spinner */}
              {stage === "scanning" && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-severity-green-400" aria-hidden />
                  <p className="text-sm font-semibold text-white">{t("scan_scanning")}</p>
                  <p className="text-xs text-[#7f96ad]">{t("scan_local_note")}</p>
                </div>
              )}

              {/* SUCCESS — extracted fields */}
              {stage === "success" && result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-severity-green-400/30 bg-severity-green-400/10 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-severity-green-400" aria-hidden />
                    <p className="text-sm font-bold text-severity-green-300">{t("scan_success_title")}</p>
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[0.625rem] font-bold tabular-nums text-[#a7f3d0]">
                      {result.confidence.toFixed(1)}% {t("scan_confidence")}
                    </span>
                  </div>

                  <dl className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Field label={t("scan_name")} value={result.fields.name} />
                    <Field label={t("scan_number")} value={result.fields.documentNumber} />
                    <Field label={t("scan_dob")} value={result.fields.dateOfBirth} />
                  </dl>

                  <button
                    type="button"
                    onClick={saveId}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#0d9488] text-sm font-bold text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-green-400"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {t("scan_save_button")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStage("idle");
                      setPreview(null);
                      setResult(null);
                    }}
                    className="flex h-11 w-full items-center justify-center rounded-xl text-xs font-semibold text-[var(--dl-text-muted)] transition hover:text-white"
                  >
                    {t("scan_scan_another")}
                  </button>
                </div>
              )}

              {/* SAVED — persisted locally */}
              {stage === "saved" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-severity-green-400/20 ring-1 ring-severity-green-400/40"
                  >
                    <CheckCircle2 className="h-8 w-8 text-severity-green-400" aria-hidden />
                  </motion.span>
                  <p className="text-sm font-bold text-white">{t("scan_saved")}</p>
                  <p className="text-xs text-[#7f96ad]">{t("scan_saved_desc")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setStage("idle");
                      setPreview(null);
                      setResult(null);
                    }}
                    className="mt-1 flex h-11 w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 text-xs font-bold text-[#cfe0f2] transition hover:bg-white/10"
                  >
                    {t("scan_scan_another")}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A single label/value row in the extracted-fields list. */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wider text-[var(--dl-text-muted)]">
        {label}
      </dt>
      <dd className="truncate text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}

export default DocumentScanner;
