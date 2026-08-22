"use client";

import Image from "next/image";
import { Camera } from "lucide-react";

// ---------------------------------------------------------------------
// components/help/HelpImage.tsx — screenshot with graceful fallback.
//
// Renders the real captured screenshot when it exists; otherwise a
// styled "screenshot pending" frame so the Help Center works beautifully
// even before `npm run help:shots` has been run.
//
// The onError swap happens at runtime because next/image can't know at
// build time whether a static file exists.
// ---------------------------------------------------------------------

import { useState } from "react";

type HelpImageProps = {
  /** Path under /public, e.g. /help/shots/send-sos.webp */
  src: string;
  alt: string;
  /** Accessible label used inside the placeholder frame. */
  topicTitle: string;
  className?: string;
};

export function HelpImage({ src, alt, topicTitle, className = "" }: HelpImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (screenshot pending)`}
        className={`flex aspect-[16/10] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/15 bg-gradient-to-br from-white/[0.04] to-transparent ${className}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
          <Camera aria-hidden="true" className="h-5 w-5 text-slate-400" />
        </span>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">{topicTitle}</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Screenshot pending — run{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
              npm run help:shots
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-black/30 ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={800}
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1100px"
        className="h-auto w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default HelpImage;
