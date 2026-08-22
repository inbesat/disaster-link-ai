"use client";

import { useState } from "react";
import { MessageCircle, Bug, X, HelpCircle } from "lucide-react";
import BugReportModal from "./BugReportModal";

export default function SupportButton() {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const contactOptions = [
    {
      label: "Report a Bug",
      description: "Something isn't working correctly",
      icon: Bug,
      action: () => {
        setShowModal(true);
        setExpanded(false);
      },
    },
    {
      label: "Feature Request",
      description: "Suggest an improvement",
      icon: HelpCircle,
      action: () => {
        setShowModal(true);
        setExpanded(false);
      },
    },
    {
      label: "Email Support",
      description: "safesphere095@gmail.com",
      icon: MessageCircle,
      action: () => window.open("mailto:safesphere095@gmail.com", "_blank"),
    },
    {
      label: "Emergency Helpline",
      description: "+91-9625130964",
      icon: MessageCircle,
      action: () => window.open("tel:+919625130964", "_blank"),
    },
    {
      label: "Alternate Contact",
      description: "+91-7251014013",
      icon: MessageCircle,
      action: () => window.open("tel:+917251014013", "_blank"),
    },
  ];

  return (
    <>
      <div className="fixed bottom-24 left-4 z-50">
        <div className="relative">
          {/* Expanded options */}
          {expanded && (
            <div className="absolute bottom-16 right-0 mb-2 w-56 animate-slide-up">
              <div className="eoc-panel rounded-xl border border-border/50 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="p-2">
                  {contactOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={option.action}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition hover:bg-surface-muted"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <option.icon className="h-4 w-4 text-accent" aria-hidden />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{option.label}</p>
                        <p className="text-xs text-slate-500">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main button */}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Close support options" : "Open support options"}
          aria-expanded={expanded}
          className="flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] transition hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-[var(--dl-navy)]"
        >
          <MessageCircle className="h-5 w-5 flex-shrink-0" aria-hidden />
          <span className="hidden sm:inline">Support</span>
          <X className={`h-4 w-4 transition-transform ${expanded ? "rotate-45" : ""}`} aria-hidden />
        </button>
      </div>

      <BugReportModal isOpen={showModal} onClose={() => setShowModal(false)} />

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
}