"use client";

// ---------------------------------------------------------------------
// components/ai/ChatInterface.tsx — Offline-First Architecture · Phase 6
//
// The Phase 6 deliverable name for the dual-mode chat interface (the
// spec's "Updated ChatInterface.tsx with mode indicators"). The full
// implementation lives in DualModeChat.tsx — this is the canonical entry
// point so the deliverable can be imported as ChatInterface.
//
// Includes everything Phase 6 calls for:
//   • mode indicator top bar — green "Online — Cloud" / orange "Offline —
//     Gemma Local" / red "No AI Available"
//   • message badges — "Cloud" / "Local" chip in each AI bubble's corner
//   • streaming local replies rendered token-by-token
//   • IndexedDB persistence (chat survives refresh/blackout)
//   • per-message "Copy to clipboard" + "Report incorrect"
// ---------------------------------------------------------------------

import DualModeChat from "./DualModeChat";

export interface ChatInterfaceProps {
  district?: string;
  /** Route sends through the streaming path when true. */
  stream?: boolean;
}

/** Phase 6 chat interface — cloud ↔ offline dual-mode (see DualModeChat). */
export function ChatInterface({ district, stream = true }: ChatInterfaceProps) {
  return <DualModeChat district={district} stream={stream} />;
}

export default ChatInterface;
