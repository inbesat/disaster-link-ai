"use client";

// ---------------------------------------------------------------------
// components/field/QRScannerModal.tsx — Phase 14 · Step 5.
//
// Hardware QR / barcode scanning for resource pallets & shelter intake
// logs. Powered by html5-qrcode (installed: `npm install html5-qrcode`).
//
//   • Tapping "Scan QR" opens a full-screen modal and starts the REAR
//     device camera (facingMode: environment).
//   • A viewfinder overlay (corner brackets + animated scan line) shows
//     the scan area; a decoded code pops a success card
//     ("Verified: 50 Medical Kits Checked Out") and closes the scanner.
//   • "Simulate Scan" covers desktop demoing (no camera) — it verifies a
//     mock kit-pallet payload instead.
//   • Camera errors (permission denied / no camera) degrade gracefully to
//     the simulate path so the demo never dead-ends.
//
// The html5-qrcode lib is imported lazily inside the effect so the module
// never touches the server bundle at build time.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { X, ScanLine, Camera, CheckCircle2, PackageCheck } from "lucide-react";
import toast from "react-hot-toast";
import { triggerHeavyHaptic, triggerLightHaptic } from "@/hooks/useHaptics";

type ScanResult = { text: string; label: string };

const MOCK_KIT_PAYLOAD = "DRIP|MEDKIT|50|SHELTER-X";
const SUCCESS_CARD: ScanResult = {
  text: MOCK_KIT_PAYLOAD,
  label: "Verified: 50 Medical Kits Checked Out",
};

export default function QRScannerModal() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const readerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);

  async function stopScanner() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* already stopped */
    }
    scannerRef.current = null;
  }

  // Cleanup on unmount + when the modal closes.
  useEffect(() => {
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCameraError(null);
    setScanning(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!readerRef.current) {
        // Reader element never mounted (e.g. modal closed mid-start) —
        // don't leave the UI stuck in the "scanning" state.
        setScanning(false);
        return;
      }
      const scanner = new Html5Qrcode("field-qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => onDetected(decodedText),
        () => {
          /* per-frame decode misses are fine — keep scanning */
        },
      );
    } catch (err) {
      console.warn("[qr] camera unavailable", err);
      setScanning(false);
      setCameraError(
        "Camera unavailable (permission denied or no rear camera). Use Simulate Scan.",
      );
    }
  }

  function onDetected(text: string) {
    triggerHeavyHaptic();
    void stopScanner();
    setScanning(false);
    setResult({ ...SUCCESS_CARD, text });
    toast.success("QR Verified");
  }

  function simulateScan() {
    triggerHeavyHaptic();
    onDetected(MOCK_KIT_PAYLOAD);
  }

  function openModal() {
    triggerLightHaptic();
    setResult(null);
    setCameraError(null);
    setOpen(true);
    // Give the DOM a tick to mount the reader element before starting.
    setTimeout(() => void startCamera(), 120);
  }

  function closeModal() {
    void stopScanner();
    setOpen(false);
    setScanning(false);
    setResult(null);
  }

  return (
    <>
      {/* Trigger — prominent scan affordance for the tasks page */}
      <button
        type="button"
        onClick={openModal}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-cyan-400/50 bg-cyan-500/10 px-4 text-base font-bold text-cyan-300 transition active:scale-95"
      >
        <ScanLine className="h-6 w-6" aria-hidden />
        Scan QR / Barcode
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR scanner"
          className="fixed inset-0 z-[85] flex flex-col bg-black"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-lg font-bold text-white">Scan Resource</p>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close scanner"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white transition active:scale-95"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Camera / viewfinder area */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {scanning && (
              <>
                <div
                  id="field-qr-reader"
                  ref={readerRef}
                  className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
                />
                {/* Viewfinder overlay — corner brackets + scan line */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-56 w-56">
                    {["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "bottom-0 right-0 border-b-4 border-r-4"].map(
                      (corner) => (
                        <span
                          key={corner}
                          className={`absolute h-10 w-10 border-cyan-300 ${corner}`}
                        />
                      ),
                    )}
                    <span className="qr-scanline absolute inset-x-3 h-0.5 bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                  </div>
                </div>
                <p className="absolute bottom-6 flex items-center gap-2 text-base font-semibold text-cyan-200">
                  <Camera className="h-5 w-5 animate-pulse" /> Point at a QR code or pallet barcode
                </p>
              </>
            )}

            {/* Success card — verified, then auto-close */}
            {result && (
              <div className="mx-4 w-full max-w-sm rounded-3xl border-2 border-emerald-400 bg-[#04120a] p-8 text-center shadow-[0_0_60px_rgba(52,211,153,0.35)]">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500/15 text-emerald-300">
                  <CheckCircle2 className="h-11 w-11" />
                </div>
                <p className="mt-4 flex items-center justify-center gap-2 text-2xl font-black text-emerald-300">
                  <PackageCheck className="h-7 w-7" /> {result.label}
                </p>
                <p className="mt-2 break-all font-mono text-sm text-emerald-200/60">
                  {result.text}
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-6 min-h-[52px] w-full rounded-full bg-emerald-500 text-lg font-black text-black transition active:scale-95"
                >
                  Done
                </button>
              </div>
            )}

            {/* Camera error fallback */}
            {!scanning && !result && (
              <div className="mx-4 w-full max-w-sm text-center">
                <Camera className="mx-auto h-14 w-14 text-slate-500" />
                <p className="mt-3 text-lg font-semibold text-slate-300">
                  {cameraError ?? "Scanner idle"}
                </p>
              </div>
            )}
          </div>

          {/* Footer controls */}
          {!result && (
            <div className="border-t border-white/10 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={simulateScan}
                className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/25 bg-white/5 text-lg font-bold text-white transition active:scale-95"
              >
                <ScanLine className="h-6 w-6" /> Simulate Scan (desktop demo)
              </button>
              {cameraError && (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="mt-3 min-h-[48px] w-full rounded-2xl border border-cyan-400/50 text-base font-bold text-cyan-300"
                >
                  Retry Camera
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes qrScan {
          0%, 100% { top: 6px; }
          50% { top: calc(100% - 6px); }
        }
        .qr-scanline { animation: qrScan 2.2s ease-in-out infinite; }
      `}</style>
    </>
  );
}
