"use client";

// ---------------------------------------------------------------------
// components/public/ShareRouteButton.tsx — Phase 1 · Step 7 · "Share via
// WhatsApp".
//
// Attaches to route / center cards so a citizen can hand their escape
// route to family over WhatsApp. Clicking builds the wa.me deep link
// (https://wa.me/?text=…) with the step-spec message — "Safe evacuation
// route from MyLocation to <Destination>. Distance: X km. ETA: Y min.
// Open in Maps: <Link>" — and opens it in a new tab, which native-opens
// WhatsApp even when the recipient isn't saved.
//
// Pure shell: the message + URL are built by lib/map/whatsapp-share (and
// unit-tested there); this component only renders the prominent green
// button and launches the link.
// ---------------------------------------------------------------------

import { MessageCircle } from "lucide-react";
import { buildWhatsAppShareUrl, type RouteShareDetails } from "@/lib/map/whatsapp-share";

export type ShareRouteButtonProps = RouteShareDetails & {
  /** Extra className for sizing inside a chat bubble / card. */
  className?: string;
};

export default function ShareRouteButton({
  originLabel,
  destination,
  distanceKm,
  etaMinutes,
  mapsUrl,
  className = "",
}: ShareRouteButtonProps) {
  const href = buildWhatsAppShareUrl({
    originLabel,
    destination,
    distanceKm,
    etaMinutes,
    mapsUrl,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-3 text-sm font-bold text-[#0b3d1f] shadow-[0_0_18px_rgba(37,211,102,0.35)] transition hover:bg-[#1ebe5b] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25d366] ${className}`}
    >
      <MessageCircle aria-hidden="true" className="h-4 w-4" />
      Share via WhatsApp
    </a>
  );
}
