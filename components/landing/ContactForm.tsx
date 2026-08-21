"use client";

import { useState } from "react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import Eyebrow from "@/components/landing/ui/Eyebrow";
import { Send, CheckCircle2, ArrowLeft, Zap } from "lucide-react";

type FormStatus = "idle" | "sending" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [fallbackQuery, setFallbackQuery] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    setFallbackQuery(
      new URLSearchParams({
        subject: `Demo Request — ${data.organization || "Unknown org"} (${data.role || "Unspecified"})`,
        body: `Name: ${data.name}\nOrganization: ${data.organization}\nEmail: ${data.email}\nPhone: ${data.phone}\nRole: ${data.role}\n\n${data.message}`,
      }).toString(),
    );

    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
      form.reset();
    } catch (err) {
      console.error("[ContactForm] demo request failed:", err);
      setStatus("error");
    }
  }

  return (
    <section className="bg-[var(--bg-primary)] py-28">
      <div className="max-w-2xl mx-auto px-6">
        <ScrollReveal>
          <div className="bg-white/5 border border-slate-800 rounded-[var(--radius-xl6)] p-8 md:p-10 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-sm">
            {status === "success" ? (
              /* ── Thank You State ── */
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/30 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8 text-[var(--accent-success)]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Thank you!
                </h3>
                <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                  Your demo request has been received. Our team will review your
                  details and reach out within{" "}
                  <strong className="text-[var(--accent-primary)]">2 hours</strong>.
                </p>
                <div className="inline-flex items-center gap-2 bg-white/5 border border-slate-800 rounded-full px-5 py-2.5 text-sm text-[var(--text-muted)]">
                  <Zap className="h-4 w-4 text-[var(--accent-warning)]" aria-hidden />
                  Check your email for a confirmation
                </div>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--accent-primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] rounded"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Submit another request
                </button>
              </div>
            ) : (
              /* ── Form State ── */
              <>
                <div className="mb-8">
                  <Eyebrow text="Get In Touch" variant="blue" />
                  <h2 className="text-3xl md:text-4xl font-bold text-white mt-4">
                    Request a demo
                  </h2>
                  <p className="text-[var(--text-secondary)] mt-3">
                    Whether you&apos;re a government body, rescue organization,
                    or NGO — we&apos;ll set up a personalized demo for your
                    region.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="cf-name"
                        className="text-sm font-medium text-slate-200 mb-1.5 block"
                      >
                        Full Name
                      </label>
                      <input
                        id="cf-name"
                        type="text"
                        name="name"
                        required
                        className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="cf-org"
                        className="text-sm font-medium text-slate-200 mb-1.5 block"
                      >
                        Organization
                      </label>
                      <input
                        id="cf-org"
                        type="text"
                        name="organization"
                        required
                        className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        placeholder="District Administration"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="cf-email"
                        className="text-sm font-medium text-slate-200 mb-1.5 block"
                      >
                        Email
                      </label>
                      <input
                        id="cf-email"
                        type="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        placeholder="jane@agency.gov.in"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="cf-phone"
                        className="text-sm font-medium text-slate-200 mb-1.5 block"
                      >
                        Phone
                      </label>
                      <input
                        id="cf-phone"
                        type="tel"
                        name="phone"
                        required
                        className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        placeholder="+91-98765-43210"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="cf-role"
                      className="text-sm font-medium text-slate-200 mb-1.5 block"
                    >
                      Role
                    </label>
                    <select
                      id="cf-role"
                      name="role"
                      required
                      className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all appearance-none"
                    >
                      <option value="">Select your role</option>
                      <option value="Government">Government Official</option>
                      <option value="Police">Police / Law Enforcement</option>
                      <option value="NGO">NGO / Relief Organization</option>
                      <option value="Citizen">Citizen / Community Leader</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="cf-message"
                      className="text-sm font-medium text-slate-200 mb-1.5 block"
                    >
                      Message
                    </label>
                    <textarea
                      id="cf-message"
                      rows={4}
                      name="message"
                      required
                      className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all resize-none"
                      placeholder="Tell us about your district or use case..."
                    />
                  </div>

                  {status === "error" && (
                    <div className="bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30 rounded-lg p-4 text-sm text-red-300">
                      Couldn&apos;t send automatically.{" "}
                      <a
                        href={`mailto:safesphere095@gmail.com,anonymous4w08@gmail.com?${fallbackQuery}`}
                        className="font-semibold underline hover:text-red-200"
                      >
                        Click here to email us directly
                      </a>{" "}
                      — your message opens pre-filled in your mail app.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full mt-2 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--brand-blue-light)] text-white rounded-full py-3.5 font-semibold hover:shadow-[0_20px_60px_-20px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {status === "sending" ? (
                      "Sending..."
                    ) : (
                      <>
                        Request Demo
                        <Send className="h-4 w-4" aria-hidden />
                      </>
                    )}
                  </button>

                  {/* Response Time Promise */}
                  <p className="text-center text-xs text-[var(--text-muted)] mt-3">
                    <Zap className="inline h-3.5 w-3.5 text-[var(--accent-warning)] mr-1" aria-hidden />
                    We reply to all inquiries within{" "}
                    <strong className="text-[var(--text-secondary)]">2 hours</strong>
                  </p>
                </form>
              </>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
