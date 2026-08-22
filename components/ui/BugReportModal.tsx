"use client";

import { useState, useEffect, useRef } from "react";
import { X, Bug, Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type IssueType = "bug" | "feature" | "performance" | "accessibility" | "other";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [type, setType] = useState<IssueType>("bug");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLTextAreaElement>(null);

  const issueTypes: { value: IssueType; label: string; icon: React.ReactNode }[] = [
    { value: "bug", label: "Bug Report", icon: <Bug className="h-4 w-4" /> },
    { value: "feature", label: "Feature Request", icon: <Mail className="h-4 w-4" /> },
    { value: "performance", label: "Performance Issue", icon: <AlertCircle className="h-4 w-4" /> },
    { value: "accessibility", label: "Accessibility", icon: <AlertCircle className="h-4 w-4" /> },
    { value: "other", label: "Other", icon: <Mail className="h-4 w-4" /> },
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => focusRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const { error } = await getSupabase().from("bug_reports").insert({
        type,
        description: description.trim(),
        email: email.trim() || null,
        url: window.location.href,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setStatus("success");
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    } catch (err) {
      console.error("[BugReport] Submission failed:", err);
      setStatus("error");
      setErrorMessage("Failed to submit. Please try again or email us directly.");
    }
  };

  const resetForm = () => {
    setType("bug");
    setDescription("");
    setEmail("");
    setStatus("idle");
    setErrorMessage("");
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bug-modal-title"
    >
      <div
        ref={modalRef}
        className="eoc-panel w-full max-w-md rounded-xl shadow-[0_25px_80px_-12px_rgba(0,0,0,0.9)] overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
              <Bug className="h-5 w-5 text-accent" aria-hidden />
            </div>
            <h2 id="bug-modal-title" className="text-lg font-semibold">Report an Issue</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-surface-muted transition"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {status === "success" ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-400" aria-hidden />
            </div>
            <h3 className="text-lg font-semibold">Thanks for reporting!</h3>
            <p className="mt-1 text-slate-400">Your feedback helps make SafeSphere better for everyone.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="eoc-label block mb-2">Issue Type</label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Select issue type">
                {issueTypes.map(({ value, label, icon }) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={type === value}
                    onClick={() => setType(value)}
                    className={`relative p-3 rounded-lg border-2 text-sm font-medium text-center transition ${
                      type === value
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-surface-muted text-slate-300 hover:border-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">{icon}</div>
                    <span className="block truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="eoc-label block mb-1.5">
                Description <span className="text-severity-red-400">*</span>
              </label>
              <textarea
                ref={focusRef}
                id="description"
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail. Include steps to reproduce, expected vs actual behavior, and any error messages..."
                className="w-full rounded-md border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:outline-none resize-none"
                disabled={status === "submitting"}
              />
            </div>

            <div>
              <label htmlFor="email" className="eoc-label block mb-1.5">
                Your Email (optional)
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com (for follow-up)"
                className="w-full rounded-md border border-border bg-surface-muted px-3 py-2.5 text-sm text-foreground placeholder:text-slate-500 focus:border-accent focus:outline-none"
                disabled={status === "submitting"}
              />
            </div>

            {errorMessage && (
              <div className="rounded-md border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-sm text-severity-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden />
                {errorMessage}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={status === "submitting"}
                className="flex-1 rounded-md border border-border bg-surface-muted px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-elevated disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "submitting" || !description.trim()}
                className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "submitting" ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-slide-up { animation: slide-up 0.25s ease-out; }
      `}</style>
    </div>
  );
}