"use client";

// ---------------------------------------------------------------------
// components/settings/AvatarCropperModal.tsx — Settings · Phase 3.
//
// Interactive square-crop modal for avatar uploads. Standard canvas
// cropping (react-easy-crop is intentionally not added — canvas keeps the
// bundle lean). Features:
//   • Zoom — range slider + mouse wheel (1x–4x).
//   • Pan  — drag the image inside the square viewport (clamped so the
//     crop area is always fully covered).
//   • Crop — the visible square is drawn to a 256×256 canvas and exported
//     as a compressed JPEG data URI (quality 0.85).
//   • Esc / backdrop click cancels; pointer capture keeps dragging smooth.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { Crop, Loader2, X, ZoomIn } from "lucide-react";
import { dataUriToBlob } from "@/lib/settings/avatar";

const VIEWPORT = 320; // display size of the square crop area (px)
const OUTPUT = 256; // exported avatar size (px)
const COMPRESSION = 0.85;

type DragState = { startX: number; startY: number; ox: number; oy: number } | null;

export default function AvatarCropperModal({
  imageSrc,
  onClose,
  onSave,
}: {
  imageSrc: string | null;
  onClose: () => void;
  /** Returns the compressed cropped data URI (and its Blob for upload). */
  onSave: (dataUri: string, blob: Blob) => void | Promise<void>;
}) {
  const [zoom, setZoom] = useState(1.4);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Reset state whenever a new image arrives.
  useEffect(() => {
    setZoom(1.4);
    setOffset({ x: 0, y: 0 });
    setError(null);
    setSaving(false);
  }, [imageSrc]);

  // Escape to close + non-passive wheel listener (so zoom doesn't scroll page).
  useEffect(() => {
    if (!imageSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const vp = viewportRef.current;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.min(4, Math.max(1, +(z + delta).toFixed(2))));
    };
    vp?.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", onKey);
      vp?.removeEventListener("wheel", onWheel);
    };
  }, [imageSrc, onClose]);

  const natural = imgRef.current
    ? { w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight }
    : null;

  // Cover-scale so the image always fills the square, then apply zoom.
  const scale = natural
    ? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) * zoom
    : VIEWPORT;
  const dispW = natural ? natural.w * scale : VIEWPORT;
  const dispH = natural ? natural.h * scale : VIEWPORT;

  // Clamp offsets so the image can never leave the viewport.
  const maxX = Math.max(0, (dispW - VIEWPORT) / 2);
  const maxY = Math.max(0, (dispH - VIEWPORT) / 2);
  const ox = Math.min(maxX, Math.max(-maxX, offset.x));
  const oy = Math.min(maxY, Math.max(-maxY, offset.y));

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startY: e.clientY, ox, oy };
    },
    [ox, oy],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
    },
    [],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
  }, []);

  function cropAndSave() {
    if (!imgRef.current || !natural) return;
    const img = imgRef.current;
    setSaving(true);
    setError(null);
    try {
      // Map the visible viewport square back to source pixel coordinates.
      // The image is positioned at left:50% with translate(calc(-50% + ox)),
      // so its left edge sits at (VIEWPORT/2 - dispW/2 + ox). A display
      // point p maps to source via (p - imageLeft) / scale; p=0 (viewport
      // top-left) gives the crop origin. The pan clamp already guarantees
      // this stays inside [0, natural - sourceSize].
      const sourceSize = VIEWPORT / scale;
      const srcX = (dispW / 2 - VIEWPORT / 2 - ox) / scale;
      const srcY = (dispH / 2 - VIEWPORT / 2 - oy) / scale;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable.");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, srcX, srcY, sourceSize, sourceSize, 0, 0, OUTPUT, OUTPUT);

      const dataUri = canvas.toDataURL("image/jpeg", COMPRESSION);
      const blob = dataUriToBlob(dataUri);

      // onSave may be sync or async — normalise before attaching .catch().
      Promise.resolve(onSave(dataUri, blob))
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Failed to save avatar.");
        })
        .finally(() => setSaving(false));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not process the image.");
      setSaving(false);
    }
  }

  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop your avatar"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-eoc border border-[#1c2740] bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-cyan-400" aria-hidden />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Crop Your Avatar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-surface-muted hover:text-slate-200"
            aria-label="Close cropper"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Square viewport */}
        <div
          ref={viewportRef}
          className="relative mx-auto mt-4 select-none overflow-hidden rounded-md border border-[#2c3f6d] bg-surface-muted"
          style={{ width: VIEWPORT, height: VIEWPORT, maxWidth: "100%" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- the
              cropper needs a raw <img> (naturalWidth + pixel drawing);
              next/image can't crop a data-URI source. */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Avatar preview"
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
            style={{
              width: dispW,
              height: dispH,
              transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`,
            }}
          />
          {/* Crop frame + grid overlay */}
          <div className="pointer-events-none absolute inset-0 border-2 border-cyan-400/80">
            {/* Rule-of-thirds grid — 2 horizontal + 2 vertical guides */}
            <div className="absolute inset-x-0 top-1/3 h-px bg-white/15" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white/15" />
            <div className="absolute inset-y-0 left-1/3 w-px bg-white/15" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white/15" />
          </div>
        </div>

        {/* Zoom control */}
        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[#2c3f6d] accent-cyan-400"
          />
          <span className="w-10 text-right font-mono text-xs text-slate-400">
            {zoom.toFixed(1)}x
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Drag to reposition · scroll or slider to zoom · the square is your
          final avatar.
        </p>

        {error && (
          <p className="mt-3 rounded-md border border-severity-red-600/50 bg-severity-red-600/10 px-3 py-2 text-xs text-severity-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#2c3f6d] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !natural}
            onClick={cropAndSave}
            className="inline-flex items-center gap-2 rounded-md bg-cyan-500 px-5 py-2 text-sm font-bold text-slate-950 shadow-glow-accent transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Apply Crop"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
