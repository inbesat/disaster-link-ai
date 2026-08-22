"use client";

// ---------------------------------------------------------------------
// components/ui/Modal.tsx — UI/UX Phase 1 · Prompt 1.4
//
// Canonical modal/dialog component with:
//   - Header (title + close button)
//   - Body (scrollable content area)
//   - Footer (action buttons)
//   - Backdrop click to close
//   - Escape key to close
//   - Body scroll lock
//   - Focus trap
//   - Framer Motion animation
//   - role="dialog" + aria-modal="true"
//   - aria-labelledby for title
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

export interface ModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Callback when the modal should close. */
  onClose: () => void;
  /** Modal title — displayed in the header and used as aria-labelledby. */
  title: string;
  /** Optional icon to show next to the title. */
  icon?: ReactNode;
  /** Modal body content. */
  children: ReactNode;
  /** Optional footer content (action buttons). */
  footer?: ReactNode;
  /** Modal size preset. */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether clicking the backdrop closes the modal (default true). */
  closeOnBackdrop?: boolean;
  /** Whether pressing Escape closes the modal (default true). */
  closeOnEscape?: boolean;
  /** Additional className for the modal content container. */
  className?: string;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = "",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element to restore on close
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first focusable element
    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    dialog.addEventListener("keydown", handleTab);
    return () => dialog.removeEventListener("keydown", handleTab);
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Restore focus on close
  useEffect(() => {
    if (!open && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [open]);

  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdrop) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  const titleId = `modal-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`relative flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border bg-[var(--bg-secondary)] shadow-xl ${SIZE_CLASSES[size]} ${className}`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              {icon && (
                <span className="text-accent-primary">{icon}</span>
              )}
              <h2 id={titleId} className="flex-1 text-lg font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
              <IconButton
                label="Close"
                variant="ghost"
                size="md"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </IconButton>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
