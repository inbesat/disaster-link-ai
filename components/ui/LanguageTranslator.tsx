// ---------------------------------------------------------------------
// components/ui/LanguageTranslator.tsx — Google Translate widget host.
//
// Placeholder div that app/layout.tsx's Google Translate init script
// (googleTranslateElementInit) injects the real dropdown into. Drop in
// any navbar/header (landing, public dashboard, command center) to get
// the site-wide language switcher. Dark-themed via the GOOGLE TRANSLATE
// block at the bottom of app/globals.css.
// ---------------------------------------------------------------------
export default function LanguageTranslator() {
  return <div id="google_translate_element" className="flex items-center"></div>;
}