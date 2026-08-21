"use client";

import { useState } from "react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import Eyebrow from "@/components/landing/ui/Eyebrow";
import { Mail, Code, Phone, MapPin } from "lucide-react";

const contacts = [
  {
    icon: Mail,
    color: "blue",
    label: "Email",
    value: "safesphere095@gmail.com",
    href: "mailto:safesphere095@gmail.com",
  },
  {
    icon: Code,
    color: "orange",
    label: "Bug Reports",
    value: "anonymous4w08@gmail.com",
    href: "mailto:anonymous4w08@gmail.com",
  },
  {
    icon: Phone,
    color: "green",
    label: "Emergency Helpline",
    value: "+91-9625130964",
    href: "tel:+919625130964",
  },
  {
    icon: Phone,
    color: "green",
    label: "Alternate Contact",
    value: "+91-7251014013",
    href: "tel:+917251014013",
  },
  {
    icon: MapPin,
    color: "blue",
    label: "Headquarters",
    value: "New Delhi, India",
    href: null,
  },
];

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [fallbackQuery, setFallbackQuery] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setStatus("sending");
    // Prefill the mailto fallback with whatever the visitor typed, so even
    // a backend failure never loses the lead.
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
      console.error("[Contact] demo request failed:", err);
      setStatus("error");
    }
  }

  return (
    <section className="bg-primary py-28">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
        <ScrollReveal animation="fade-right">
          <div>
            <Eyebrow text="Get In Touch" variant="blue" />
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mt-4">
              Request a demo for your district or agency
            </h2>
            <p className="text-slate-400 mt-4 leading-relaxed mb-10">
              Whether you&apos;re a government body, rescue organization, or NGO — our
              team will set up a personalized demo for your region.
            </p>

            <div className="space-y-6">
              {contacts.map((contact, i) => {
                const Icon = contact.icon;
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        contact.color === "blue"
                          ? "bg-[#2563EB]/10"
                          : contact.color === "orange"
                            ? "bg-[#F97316]/10"
                            : "bg-emerald-500/10"
                      }`}
                    >
                      <Icon
                        className={`${
                          contact.color === "blue"
                            ? "text-[var(--blue-light)]"
                            : contact.color === "orange"
                              ? "text-[var(--orange)]"
                              : "text-emerald-400"
                        }`}
                        size={18}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs text-slate-400 uppercase tracking-wider">
                        {contact.label}
                      </h5>
                      {contact.href ? (
                        <a
                          href={contact.href}
                          className="text-white font-medium hover:text-[var(--blue-light)]"
                        >
                          {contact.value}
                        </a>
                      ) : (
                        <div className="text-white font-medium">{contact.value}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-left" delay={0.2}>
          <div className="bg-white/5 border border-slate-800 rounded-[var(--radius-xl6)] p-8 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]">
            {status === "success" ? (
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5 text-emerald-300 font-medium">
                ✓ Thanks — your request has been emailed to our team and we&apos;ll follow up shortly.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-slate-200 mb-1.5 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 mb-1.5 block">
                    Organization
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 mb-1.5 block">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 mb-1.5 block">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 mb-1.5 block">
                    Role
                  </label>
                  <select
                    name="role"
                    required
                    className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[#2563EB]/20 transition-all appearance-none"
                  >
                    <option value=""></option>
                    <option value="Government">Government</option>
                    <option value="Police">Police</option>
                    <option value="NGO">NGO</option>
                    <option value="Citizen">Citizen</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-200 mb-1.5 block">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    name="message"
                    required
                    className="w-full px-4 py-3 rounded-[var(--radius-xl4)] border border-slate-800 bg-slate-800/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  ></textarea>
                </div>

                {status === "error" && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">
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
                  className="w-full mt-2 bg-gradient-to-r from-[var(--blue)] to-[var(--blue-light)] text-white rounded-full py-3.5 font-semibold hover:shadow-[0_20px_60px_-20px_rgba(37,99,235,0.5)] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? "Sending…" : "Request Demo →"}
                </button>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
