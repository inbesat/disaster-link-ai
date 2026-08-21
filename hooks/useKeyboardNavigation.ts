"use client";

import { useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------
// hooks/useKeyboardNavigation.ts — Phase 17 · Step 4.
//
// Keyboard navigation utilities:
//   • useEscapeKey: fires callback on Escape press
//   • useArrowKeyNavigation: arrow key navigation within a list/grid
//   • useFocusTrap: traps focus within a container (for modals)
// ---------------------------------------------------------------------

/**
 * Fires callback when Escape is pressed.
 * Automatically cleans up the event listener.
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [callback, enabled]);
}

type ArrowNavigationOptions = {
  /** Selector for navigable items within the container */
  itemSelector: string;
  /** Navigation direction: "horizontal" | "vertical" | "grid" */
  direction?: "horizontal" | "vertical" | "grid";
  /** Number of columns for grid navigation */
  columns?: number;
  /** Whether navigation is enabled */
  enabled?: boolean;
};

/**
 * Enables arrow key navigation within a container.
 * Returns a ref to attach to the container element.
 */
export function useArrowKeyNavigation({
  itemSelector,
  direction = "vertical",
  columns = 1,
  enabled = true,
}: ArrowNavigationOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled) return;

      const container = containerRef.current;
      if (!container) return;

      const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (direction === "grid") {
            nextIndex = Math.min(currentIndex + columns, items.length - 1);
          } else if (direction === "vertical") {
            nextIndex = Math.min(currentIndex + 1, items.length - 1);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (direction === "grid") {
            nextIndex = Math.max(currentIndex - columns, 0);
          } else if (direction === "vertical") {
            nextIndex = Math.max(currentIndex - 1, 0);
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (direction === "horizontal" || direction === "grid") {
            nextIndex = Math.min(currentIndex + 1, items.length - 1);
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (direction === "horizontal" || direction === "grid") {
            nextIndex = Math.max(currentIndex - 1, 0);
          }
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = items.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex].focus();
      }
    },
    [enabled, itemSelector, direction, columns]
  );

  return { containerRef, handleKeyDown };
}

type FocusTrapOptions = {
  /** Whether the trap is active */
  enabled?: boolean;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
};

/**
 * Traps focus within a container element.
 * Useful for modals, drawers, and dialogs.
 */
export function useFocusTrap({ enabled = true, onEscape }: FocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => onEscape?.(), enabled);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if on last, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Focus the first focusable element
    const firstFocusable = container.querySelector<HTMLElement>(focusableSelector);
    firstFocusable?.focus();

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);

  return containerRef;
}
