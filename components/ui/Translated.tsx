"use client";

// ---------------------------------------------------------------------
// components/ui/Translated.tsx
//
// Renders a single translated string by key. Because this is a client
// component, it can be embedded inside server components (page headers,
// KPI cards, etc.) that otherwise can't call useTranslation().
// ---------------------------------------------------------------------

import { useTranslation, type TranslationKey } from "@/lib/i18n/LanguageContext";

export default function Translated({
  k,
  className,
}: {
  k: TranslationKey;
  className?: string;
}) {
  const { t } = useTranslation();
  return <span className={className}>{t(k)}</span>;
}
