"use client";

import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";

const OFFICE = {
  name: "SafeSphere Headquarters",
  address: "Koramangala, Bengaluru, Karnataka 560034, India",
  lat: 12.9352,
  lng: 77.6245,
  phone: "+91-9625130964",
  email: "safesphere095@gmail.com",
  hours: "Mon – Fri, 9:00 AM – 6:00 PM IST",
};

function googleMapsEmbedUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.5!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU2JzA2LjciTiA3N8KwMzcnMjguMiJF!5e0!3m2!1sen!2sin!4v1`;
}

function googleMapsDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function LocationMap() {
  const embedUrl = googleMapsEmbedUrl(OFFICE.lat, OFFICE.lng);
  const directionsUrl = googleMapsDirectionsUrl(OFFICE.lat, OFFICE.lng);

  return (
    <section className="bg-[var(--bg-secondary)] py-28">
      <ScrollReveal>
        <SectionHead
          eyebrow="Location"
          eyebrowVariant="blue"
          title="Find us"
          subtitle="Visit our headquarters or reach out — we're always happy to connect"
          center={true}
          onNavy={true}
        />
      </ScrollReveal>

      <div className="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Map — 3/5 width */}
        <ScrollReveal className="lg:col-span-3" animation="fade-right">
          <div className="relative overflow-hidden rounded-[var(--radius-xl6)] border border-slate-800 bg-[var(--bg-tertiary)] shadow-[var(--shadow-card)]">
            {/* Dark-themed map embed */}
            <div className="relative aspect-[16/10] w-full bg-slate-800">
              <iframe
                title="SafeSphere office location on Google Maps"
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full grayscale contrast-[1.2] brightness-[0.8] hue-rotate-[180deg] invert"
              />
              {/* Overlay gradient at bottom for blend */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg-tertiary)] to-transparent"
              />
            </div>

            {/* Map caption bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-[var(--accent-primary)]" aria-hidden />
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {OFFICE.address}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Directions panel — 2/5 width */}
        <ScrollReveal className="lg:col-span-2" animation="fade-left" delay={0.15}>
          <div className="h-full bg-white/5 border border-slate-800 rounded-[var(--radius-xl6)] p-8 backdrop-blur-sm shadow-[var(--shadow-card)] flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6">
              {OFFICE.name}
            </h3>

            <div className="space-y-5 flex-1">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Address
                  </p>
                  <p className="text-sm text-white font-medium">
                    {OFFICE.address}
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-success)]/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-[var(--accent-success)]" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Office Hours
                  </p>
                  <p className="text-sm text-white font-medium">{OFFICE.hours}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-warning)]/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[var(--accent-warning)]" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Phone
                  </p>
                  <a
                    href={`tel:${OFFICE.phone.replace(/[^+\d]/g, "")}`}
                    className="text-sm text-white font-medium hover:text-[var(--accent-primary)] transition"
                  >
                    {OFFICE.phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-danger)]/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[var(--accent-danger)]" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${OFFICE.email}`}
                    className="text-sm text-white font-medium hover:text-[var(--accent-primary)] transition"
                  >
                    {OFFICE.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Get Directions CTA */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center gap-2 w-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--brand-blue-light)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] transition-all hover:shadow-[0_0_28px_rgba(59,130,246,0.35)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-tertiary)]"
            >
              <Navigation className="h-4 w-4" aria-hidden />
              Get Directions
              <ExternalLink className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
