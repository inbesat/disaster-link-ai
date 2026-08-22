import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  MapPin,
  AlertTriangle,
  Mail,
  Phone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "SafeSphere Platform Privacy Policy — How we collect, use, and protect your disaster response and location data.",
};

const SECTIONS = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: `SafeSphere ("we", "our", "us") operates the SafeSphere Platform (the "Service"), an AI-powered disaster management platform serving citizens, government agencies, rescue teams, and NGOs across India. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.`,
    extra: `By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use immediately.`,
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    subsections: [
      {
        subtitle: "2.1 Personal Information",
        items: [
          "Account Data: Name, email address, phone number, organization, role, district assignment",
          "Authentication Data: Hashed passwords, OAuth tokens (Google), OTP codes",
          "Profile Data: Avatar, preferred language, emergency contacts, accessibility preferences",
        ],
      },
      {
        subtitle: "2.2 Disaster & Location Data",
        items: [
          "Precise GPS coordinates for SOS alerts, shelter routing, and field responder dispatch",
          "District and village-level location for disaster alert targeting",
          "Shelter occupancy data, evacuation routes, and resource allocation records",
          "Field responder checklists, damage reports, and incident logs",
        ],
      },
      {
        subtitle: "2.3 Usage & Technical Data",
        items: [
          "Device Information: IP address, browser type, operating system, device identifiers",
          "Usage Analytics: Pages visited, features used, session duration, error logs",
          "Communication Logs: SMS delivery status, push notification engagement, voice call records",
          "AI Interaction Data: Chat history with AI advisors, prediction queries, planner outputs",
        ],
      },
    ],
  },
  {
    id: "how-we-use",
    title: "3. How We Use Your Information",
    items: [
      "Provide and maintain the Service, including emergency alerts, shelter locations, and resource coordination",
      "Authenticate users and manage role-based access (citizen, field responder, district admin, super admin)",
      "Send critical safety notifications (SMS, push, voice, FM broadcast) during disasters",
      "Power AI prediction models using historical disaster data to forecast floods, cyclones, and other emergencies",
      "Enable field responder coordination: real-time checklists, team location sharing, damage assessment",
      "Improve the Service through analytics, user feedback, and model training (anonymized/aggregated only)",
      "Comply with legal obligations and government disaster management mandates (NDMA, SDMA)",
    ],
  },
  {
    id: "disaster-data",
    title: "4. Disaster & Emergency Data",
    icon: AlertTriangle,
    content: `SafeSphere processes specialized disaster data that requires additional safeguards:`,
    subsections: [
      {
        subtitle: "4.1 SOS & Emergency Signals",
        items: [
          "SOS alerts transmit your precise location, identity, and emergency type to dispatchers and nearby responders",
          "Once triggered, SOS data is shared with government emergency services and cannot be deleted during active incidents",
          "Post-incident, SOS records are retained for 7 years for audit and compliance purposes",
        ],
      },
      {
        subtitle: "4.2 Location Tracking",
        items: [
          "Field responders' locations are tracked during active deployments for team coordination and safety",
          "Citizen location is only accessed when you explicitly trigger an SOS or enable shelter routing",
          "Location data is encrypted in transit (TLS 1.3) and at rest (AES-256) with strict access controls",
          "You may disable location services at any time in your device settings; core alerts will still reach you via SMS and voice",
        ],
      },
      {
        subtitle: "4.3 AI Predictions",
        items: [
          "AI models use aggregated, anonymized historical data to generate flood and disaster predictions",
          "Individual-level data is never used to train prediction models",
          "Prediction outputs (risk scores, flood maps) are shared with government agencies for coordinated response",
        ],
      },
    ],
  },
  {
    id: "data-sharing",
    title: "5. Data Sharing & Disclosure",
    content: `We do not sell your personal information. We may share data only in the following circumstances:`,
    items: [
      "Government Agencies: District/state disaster management authorities (NDMA, SDMA, collectors) for coordinated emergency response — as required by law",
      "Service Providers: Supabase (database/auth), Twilio (SMS/voice), Google (OAuth/Translate), hosting providers — all under Data Processing Agreements (DPAs)",
      "Emergency Situations: To protect life/safety during active disasters (Good Samaritan provisions under Indian law)",
      "Legal Requirements: When compelled by court order, subpoena, or applicable law",
      "Aggregated Insights: Anonymized disaster statistics may be shared with researchers and policy makers to improve emergency response systems",
    ],
  },
  {
    id: "data-retention",
    title: "6. Data Retention",
    items: [
      "Account data: Retained while account is active + 90 days after deletion request",
      "SOS and emergency logs: Retained 7 years for legal compliance and post-incident audit",
      "Field responder activity: Retained 3 years for training and accountability",
      "AI prediction history: Retained indefinitely in anonymized/aggregated form",
      "Analytics events: Aggregated and anonymized after 13 months",
      "Chat/AI conversation history: Retained 30 days unless saved by user; deleted on account removal",
      "Push notification tokens: Deleted immediately on account removal or app uninstall",
    ],
  },
  {
    id: "your-rights",
    title: "7. Your Rights",
    content: `Depending on your jurisdiction (GDPR, India DPDP Act 2023, etc.), you may have the right to:`,
    items: [
      "Access: Request a copy of all personal data we hold about you",
      "Correction: Request correction of inaccurate or incomplete data",
      "Deletion: Request deletion of your personal data (subject to legal retention requirements)",
      "Restriction: Request restriction of processing in certain circumstances",
      "Portability: Receive your data in a structured, machine-readable format",
      "Objection: Object to processing based on legitimate interests",
      "Withdraw Consent: Where processing is consent-based, withdraw at any time",
      "Complaint: Lodge a complaint with a supervisory authority (India: Data Protection Board)",
    ],
    extra: `To exercise these rights, contact our Data Protection Officer at dpo@safesphere.app or write to the address below. We will respond within 30 days.`,
  },
  {
    id: "security",
    title: "8. Security Measures",
    icon: Shield,
    content: `We implement industry-standard technical and organizational measures:`,
    items: [
      "Encryption in transit (TLS 1.3) and at rest (AES-256) for all data",
      "Role-based access control (RBAC) with Supabase Row Level Security policies",
      "Multi-factor authentication (MFA) for admin and government accounts",
      "Rate limiting, CSRF protection, secure httpOnly cookies, and CSP headers",
      "Regular penetration testing and automated dependency vulnerability scanning",
      "SOC 2 Type II compliance (in progress)",
      "Incident response plan with 72-hour breach notification commitment",
    ],
  },
  {
    id: "children",
    title: "9. Children's Privacy",
    content: `The Service is not directed to children under 13 (or under 18 for supervised use). We do not knowingly collect personal data from children. If you believe a child has provided us data, contact us immediately at privacy@safesphere.app and we will delete it within 48 hours.`,
  },
  {
    id: "cookies",
    title: "10. Cookies & Tracking",
    items: [
      "Essential Cookies: Required for authentication, session management, and security — cannot be disabled",
      "Analytics Cookies: Help us understand usage patterns; can be disabled via the cookie consent banner",
      "Functional Cookies: Remember your preferences (language, theme, district); optional",
      "We do not use advertising cookies or share data with advertising networks",
      "Third-party embeds (Google Maps, YouTube) may set their own cookies per their privacy policies",
    ],
  },
  {
    id: "international",
    title: "11. International Data Transfers",
    content: `Our primary infrastructure is hosted in the India (Mumbai) region. Some processing may occur in the EU (Frankfurt) for redundancy. Transfers outside India use Standard Contractual Clauses or adequacy decisions as required by the DPDP Act 2023.`,
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    content: `We may update this policy from time to time. Material changes will be announced via in-app banner, email notification (if opted in), and on this page. The "Last updated" date at the top reflects the most recent revision. Continued use of the Service after changes constitutes acceptance.`,
  },
  {
    id: "contact",
    title: "13. Contact Us",
    content: `For privacy-related inquiries:`,
    contacts: [
      { label: "Email", value: "privacy@safesphere.app", href: "mailto:privacy@safesphere.app", icon: Mail },
      { label: "General Inquiries", value: "safesphere095@gmail.com", href: "mailto:safesphere095@gmail.com", icon: Mail },
      { label: "Phone", value: "+91-9625130964", href: "tel:+919625130964", icon: Phone },
      { label: "Address", value: "Koramangala, Bengaluru, Karnataka 560034, India", href: null, icon: MapPin },
    ],
  },
];

export default function PrivacyPolicy() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero header */}
      <div className="bg-[var(--bg-secondary)] border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-primary)] mb-6">
            <Shield className="h-4 w-4" aria-hidden />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-[family-name:var(--font-display)]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            How we collect, protect, and use your data — especially disaster
            response and location information.
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Table of contents */}
        <nav className="mb-16 p-6 bg-white/5 border border-slate-800 rounded-[var(--radius-xl6)]" aria-label="Table of contents">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">
            Table of Contents
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition underline-offset-2 hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-16">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                {section.icon && (
                  <section.icon
                    className="h-6 w-6 text-[var(--accent-primary)]"
                    aria-hidden
                  />
                )}
                {section.title}
              </h2>

              {section.content && (
                <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                  {section.content}
                </p>
              )}

              {section.extra && (
                <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                  {section.extra}
                </p>
              )}

              {section.items && (
                <ul className="space-y-2.5 text-[var(--text-secondary)]">
                  {section.items.map((item, i) => {
                    const [label, ...rest] = item.split(": ");
                    const isLabel = rest.length > 0;
                    return (
                      <li key={i} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
                        <span>
                          {isLabel ? (
                            <>
                              <strong className="text-white">{label}:</strong>{" "}
                              {rest.join(": ")}
                            </>
                          ) : (
                            item
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {section.subsections && (
                <div className="space-y-6 mt-4">
                  {section.subsections.map((sub, si) => (
                    <div key={si}>
                      <h3 className="text-lg font-semibold text-white mb-3">
                        {sub.subtitle}
                      </h3>
                      <ul className="space-y-2.5 text-[var(--text-secondary)]">
                        {sub.items.map((item, i) => {
                          const [label, ...rest] = item.split(": ");
                          const isLabel = rest.length > 0;
                          return (
                            <li key={i} className="flex gap-3">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
                              <span>
                                {isLabel ? (
                                  <>
                                    <strong className="text-white">
                                      {label}:
                                    </strong>{" "}
                                    {rest.join(": ")}
                                  </>
                                ) : (
                                  item
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {section.contacts && (
                <div className="space-y-4 mt-4">
                  {section.contacts.map((c, ci) => (
                    <div key={ci} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                        <c.icon className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                          {c.label}
                        </p>
                        {c.href ? (
                          <a
                            href={c.href}
                            className="text-sm text-white font-medium hover:text-[var(--accent-primary)] transition"
                          >
                            {c.value}
                          </a>
                        ) : (
                          <p className="text-sm text-white font-medium">
                            {c.value}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Have questions about your privacy?
          </p>
          <a
            href="mailto:privacy@safesphere.app"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 px-6 py-3 text-sm font-semibold text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)]/20"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Contact our Privacy Team
          </a>
        </div>
      </div>
    </main>
  );
}
