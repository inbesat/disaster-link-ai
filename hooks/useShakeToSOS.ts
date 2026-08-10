"use client";

// ---------------------------------------------------------------------
// hooks/useShakeToSOS.ts — Phase 5 · Step 9 · Shake-to-SOS hardware
// simulation.
//
// Tapping buttons is hard underwater or in the dark, so a violent shake
// opens the emergency SOS modal. The hook listens to the browser's
// DeviceMotionEvent and computes the acceleration magnitude INCLUDING
// gravity (spec: "calculate acceleration (including gravity)"). A shake
// spike is any reading above a high threshold; three spikes inside a
// rolling 2-second window fires the trigger.
//
//   • Desktop fallback (spec): when DeviceMotionEvent is unavailable —
//     or iOS permission is denied — hitting the Spacebar 3 times rapidly
//     does the same thing. The spacebar path is always armed, so a laptop
//     pitch works with zero permissions.
//   • iOS Safari gates `devicemotion` behind requestPermission(), which
//     must be called from a user gesture — the hook requests it lazily
//     on the first tap/keypress and never nags otherwise.
//   • A 5s cooldown after a trigger stops residual shaking from instantly
//     re-opening the modal.
//
// The pure math (accelerationMagnitude, createSpikeDetector) lives at the
// bottom so the counting semantics are unit-tested without a browser;
// the hook is the thin event-listener wrapper around them.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

/** Defaults — a violent shake reads well above gravity (~9.8 m/s²). */
export const SHAKE_THRESHOLD = 22; // m/s² magnitude (incl. gravity)
export const SHAKE_WINDOW_MS = 2000; // rolling window for the 3 spikes
export const SHAKE_REQUIRED_SPIKES = 3; // spikes needed inside the window
export const SHAKE_COOLDOWN_MS = 5000; // lockout after a successful trigger

// ---------------------------------------------------------------------
// Pure helpers — unit-tested in hooks/useShakeToSOS.test.ts.
// ---------------------------------------------------------------------

/**
 * Euclidean magnitude of a 3-axis acceleration sample. DeviceMotionEvent
 * reports `null` per-axis when a value isn't available, so each axis
 * degrades to 0. At rest (no shake) this is ≈ 9.8 m/s² (gravity); a
 * violent shake pushes the vector sum far above `SHAKE_THRESHOLD`.
 */
export function accelerationMagnitude(accel: {
  x: number | null;
  y: number | null;
  z: number | null;
}): number {
  const x = accel.x ?? 0;
  const y = accel.y ?? 0;
  const z = accel.z ?? 0;
  return Math.sqrt(x * x + y * y + z * z);
}

export type SpikeDetectorOptions = {
  /** Rolling window (ms) in which spikes must land to count. */
  windowMs?: number;
  /** How many spikes inside the window trigger the action. */
  requiredSpikes?: number;
  /** Lockout (ms) after a trigger — residual motion can't re-fire. */
  cooldownMs?: number;
};

/**
 * Discrete-event spike counter. `fire()` records a spike timestamp; once
 * `requiredSpikes` land inside the rolling `windowMs`, it invokes
 * `onTrigger` exactly once and enters a `cooldownMs` lockout. `reset()`
 * clears both the spike log and any lockout (used when the hook disables).
 *
 * The physics decision ("is this reading a shake?") stays in the hook —
 * this object only counts events, which keeps it trivially testable.
 */
export function createSpikeDetector(
  options: SpikeDetectorOptions,
  onTrigger: () => void,
) {
  const { windowMs = 2000, requiredSpikes = 3, cooldownMs = 5000 } = options;
  let spikes: number[] = [];
  let lockedUntil = 0;

  function fire(now: number = Date.now()): void {
    if (now < lockedUntil) return;
    // Slide the window: drop spikes older than windowMs before counting.
    spikes = spikes.filter((t) => now - t <= windowMs);
    spikes.push(now);
    if (spikes.length >= requiredSpikes) {
      spikes = [];
      lockedUntil = now + cooldownMs;
      onTrigger();
    }
  }

  function reset(): void {
    spikes = [];
    lockedUntil = 0;
  }

  return { fire, reset };
}

// ---------------------------------------------------------------------
// The hook.
// ---------------------------------------------------------------------

type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
};

export type UseShakeToSOSOptions = {
  /** Acceleration magnitude (m/s², incl. gravity) that counts as a spike. */
  threshold?: number;
  /** Rolling window (ms) for the required spikes. */
  windowMs?: number;
  /** Spikes needed inside the window to trigger. */
  requiredSpikes?: number;
  /** Lockout after a trigger. */
  cooldownMs?: number;
};

/**
 * Opens the SOS flow on a violent shake (3 spikes in 2 s) or — on
 * desktop / when motion permission is unavailable — 3 rapid Spacebar
 * presses. `enabled` gates both listeners (the host passes `!isOpen` so
 * an already-open modal can't be re-triggered); the detector holds its
 * spike log across renders via a ref, so re-renders never reset a half-
 * finished shake.
 */
export function useShakeToSOS(
  onTrigger: () => void,
  enabled: boolean = true,
  options: UseShakeToSOSOptions = {},
): void {
  const { threshold = SHAKE_THRESHOLD, windowMs, requiredSpikes, cooldownMs } = options;

  // Latest callback — listeners registered once must always fire the
  // current onTrigger without re-registering on every render.
  const onTriggerRef = useRef(onTrigger);
  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  // Detector holds mutable spike state that must survive re-renders; the
  // lazy-init pattern in a ref means it's created exactly once and reads
  // the freshest callback via onTriggerRef at trigger time. The detector
  // options are mount-time constants — changing them later is ignored
  // (only `threshold`, used by the motion listener, is live).
  const detectorRef = useRef<ReturnType<typeof createSpikeDetector> | null>(null);
  if (detectorRef.current === null) {
    detectorRef.current = createSpikeDetector(
      { windowMs, requiredSpikes, cooldownMs },
      () => onTriggerRef.current(),
    );
  }

  // iOS Safari: `devicemotion` requires requestPermission() from a user
  // gesture. Until granted (or on browsers without the gate — Android
  // Chrome, desktop), the spacebar fallback stays armed, so the feature
  // never silently dies on iOS.
  const [motionEnabled, setMotionEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const MDE = window.DeviceMotionEvent as DeviceMotionEventWithPermission | undefined;
    // No constructor → no motion support at all. requestPermission present
    // → gated, start disabled and ask on the first gesture.
    return typeof MDE !== "undefined" && typeof MDE.requestPermission !== "function";
  });

  useEffect(() => {
    if (motionEnabled) return;
    const MDE = window.DeviceMotionEvent as DeviceMotionEventWithPermission | undefined;
    if (typeof MDE?.requestPermission !== "function") return;

    const request = () => {
      // Detach before requesting so a throwing (non-spec) implementation
      // can't leave these listeners erroring on every gesture; and the
      // prompt only appears once per session by design.
      window.removeEventListener("pointerdown", request);
      window.removeEventListener("keydown", request);
      MDE.requestPermission!()
        .then((state) => {
          if (state === "granted") setMotionEnabled(true);
        })
        .catch(() => {
          /* denied/blocked — spacebar fallback covers the demo */
        });
    };
    window.addEventListener("pointerdown", request);
    window.addEventListener("keydown", request);
    return () => {
      window.removeEventListener("pointerdown", request);
      window.removeEventListener("keydown", request);
    };
  }, [motionEnabled]);

  // Motion listener — only while enabled AND permission/motion is live.
  useEffect(() => {
    if (!enabled || !motionEnabled) return;
    const onDeviceMotion = (e: DeviceMotionEvent) => {
      const accel = e.accelerationIncludingGravity ?? e.acceleration;
      if (!accel) return;
      if (accelerationMagnitude(accel) < threshold) return;
      detectorRef.current?.fire();
    };
    window.addEventListener("devicemotion", onDeviceMotion);
    return () => window.removeEventListener("devicemotion", onDeviceMotion);
  }, [enabled, motionEnabled, threshold]);

  // Spacebar fallback (spec: desktop → 3 rapid presses). Skips repeats,
  // modified presses, and any keystroke aimed at an input/button so the
  // accessibility space-to-activate behaviour is never stolen.
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.key !== " " || e.repeat) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      // `a` included: Firefox activates focused links with Space — never
      // steal that, or the shake counter would hijack keyboard nav.
      if (target?.closest("input, textarea, select, button, a, [contenteditable]")) return;
      e.preventDefault(); // don't scroll the page while mashing space
      detectorRef.current?.fire();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);

  // Re-arm the detector when the feature is disabled mid-shake (modal
  // opened by another path), so a new gesture starts from a clean slate.
  useEffect(() => {
    if (!enabled) detectorRef.current?.reset();
  }, [enabled]);
}

export default useShakeToSOS;
