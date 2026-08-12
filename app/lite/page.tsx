// ---------------------------------------------------------------------
// app/lite/page.tsx — Phase 13 · Step 3 · Feature-phone lite page.
//
// Deliberately primitive: a Server Component with ZERO client hooks and
// near-zero Tailwind — plain semantic HTML + a couple of inline styles, so
// an ancient WAP/feature-phone browser can render it. Data is hardcoded
// from lib/mock-data/lite-status (the same source the SMS STATUS reply
// uses), and the page auto-refreshes every 5 minutes via a <meta> tag
// (the App Router hoists <meta>/<link> rendered anywhere into <head>).
//
// Note: <html>/<body> are NOT rendered here — only the root layout may
// own them. The outer div carries the white background so the content
// stays readable regardless of the app's dark theme.
// ---------------------------------------------------------------------

import { getLiteStatus } from "@/lib/mock-data/lite-status";

// The "Updated" stamp is computed per request — never statically
// prerender it with a build-time date.
export const dynamic = "force-dynamic";

export default function LitePage() {
  const status = getLiteStatus();

  return (
    <>
      {/* Auto-refresh every 5 minutes — feature phones have no JS. */}
      <meta httpEquiv="refresh" content="300" />

      <div
        style={{
          background: "#ffffff",
          color: "#111827",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 16,
          minHeight: "100dvh",
        }}
      >
        {/* Header */}
        <header
          style={{
            background: "#1d4ed8",
            color: "#ffffff",
            padding: "12px 16px",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 20 }}>BHARAT SHAKTI</h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.85 }}>
            Disaster response — lite version
          </p>
        </header>

        {/* Risk level */}
        <section style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
            CURRENT RISK — {status.district.toUpperCase()}
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 22,
              fontWeight: "bold",
              color: "#b45309",
            }}
          >
            {status.riskLabel}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151" }}>
            Auto-refreshes every 5 minutes.
          </p>
        </section>

        {/* Nearest shelter */}
        <section style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>NEAREST SHELTER</h2>
          <p style={{ margin: "6px 0 0", fontSize: 18, fontWeight: "bold" }}>
            {status.shelter.name}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
            {status.shelterDistanceKm} km away · {status.shelter.occupancy}/
            {status.shelter.capacity} beds · {status.shelter.medical ? "Medical " : ""}
            {status.shelter.food ? "Food" : ""}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: 14 }}>
            Call:{" "}
            <a href={`tel:${status.shelterPhone.replace(/\D/g, "")}`}>
              {status.shelterPhone}
            </a>
          </p>
        </section>

        {/* Emergency numbers */}
        <section style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb" }}>
          <h2 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>EMERGENCY NUMBERS</h2>
          <table style={{ marginTop: 6, width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {status.emergencyNumbers.map((line) => (
                <tr key={line.number} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "8px 4px 8px 0", fontSize: 15 }}>
                    {line.label}
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "right" }}>
                    <a href={`tel:${line.number}`} style={{ fontWeight: "bold", color: "#1d4ed8" }}>
                      {line.number}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* SMS help */}
        <section style={{ padding: "12px 16px" }}>
          <h2 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>NO INTERNET? USE SMS</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
            Text <strong>STATUS</strong> to this number for the current risk and nearest
            shelter, or <strong>SAFE</strong> to tell your family you are safe. Standard
            SMS rates apply.
          </p>
        </section>

        {/* Footer */}
        <footer
          style={{
            background: "#f3f4f6",
            padding: "10px 16px",
            textAlign: "center",
            fontSize: 11,
            color: "#6b7280",
          }}
        >
          SafeSphere · District Disaster Management · Updated{" "}
          {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </footer>
      </div>
    </>
  );
}
