"use client";

// ---------------------------------------------------------------------
// components/public/sos/ShakeToSOSHost.tsx — Phase 5 · Step 9 · the
// Shake-to-SOS wiring.
//
// A zero-render client island mounted once in the public layout. It owns
// the useShakeToSOS hook (3 acceleration spikes in 2 s — or 3 rapid
// Spacebar presses on desktop) and routes a recognised shake into the
// global SOS modal via useSOS().open(), so the emergency grid is one
// gesture away when the citizen can't tap buttons (underwater, dark,
// hands full).
//
// It also listens for the CITIZEN_SHAKE_SOS_EVENT that the Dev Tools
// judge trigger dispatches — the guaranteed-flawless pitch path that
// doesn't require shaking anything.
// ---------------------------------------------------------------------

import { useCallback, useEffect } from "react";
import { showToast } from "@/components/ui/Toast";
import { triggerHeavyHaptic } from "@/hooks/useHaptics";
import { useShakeToSOS } from "@/hooks/useShakeToSOS";
import { CITIZEN_SHAKE_SOS_EVENT } from "@/lib/mock-data/public-alerts";
import { useSOS } from "./SOSContext";

export function ShakeToSOSHost() {
  const { isOpen, open } = useSOS();

  const handleShake = useCallback(() => {
    if (isOpen) return; // modal already up — don't re-trigger it
    triggerHeavyHaptic();
    showToast("warning", {
      title: "Shake detected",
      description: "Opening the emergency SOS menu.",
    });
    open();
  }, [isOpen, open]);

  // Real gesture path. Disabled while the modal is already open so a
  // jittery hand can't keep re-opening it.
  useShakeToSOS(handleShake, !isOpen);

  // Dev Tools "Trigger Shake-to-SOS Event" — same pipeline as a real
  // shake, so a laptop pitch can demo the flow flawlessly.
  useEffect(() => {
    const onDemo = () => handleShake();
    window.addEventListener(CITIZEN_SHAKE_SOS_EVENT, onDemo);
    return () => window.removeEventListener(CITIZEN_SHAKE_SOS_EVENT, onDemo);
  }, [handleShake]);

  return null;
}

export default ShakeToSOSHost;
