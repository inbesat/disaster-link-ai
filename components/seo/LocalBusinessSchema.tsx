interface LocalBusinessSchemaProps {
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    availableLanguage?: string[];
  };
  sameAs?: string[];
}

export default function LocalBusinessSchema({
  name = "SafeSphere Platform",
  description = "AI-powered disaster response platform providing flood prediction, emergency planning, real-time alerts, and resource allocation for communities across India.",
  url = process.env.NEXT_PUBLIC_SITE_URL || "https://safesphere.app",
  logo = "/icons/icon-192.png",
  address = {
    streetAddress: "Koramangala",
    addressLocality: "Bengaluru",
    addressRegion: "Karnataka",
    postalCode: "560034",
    addressCountry: "IN",
  },
  contactPoint = {
    telephone: "+91-80-1234-5678",
    contactType: "customer service",
    availableLanguage: ["English", "Hindi", "Kannada"],
  },
  sameAs = [],
}: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    logo: `${url}${logo}`,
    applicationCategory: "EmergencyApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    creator: {
      "@type": "Organization",
      name: "SafeSphere",
      url,
      address: {
        "@type": "PostalAddress",
        ...address,
      },
      contactPoint: {
        "@type": "ContactPoint",
        ...contactPoint,
      },
      ...(sameAs.length > 0 && { sameAs }),
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
