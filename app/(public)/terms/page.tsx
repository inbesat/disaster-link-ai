import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "SafeSphere Platform Terms of Service — Governing your use of the emergency management platform.",
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-[var(--dl-navy)] text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-16 prose prose-invert prose-slate">
        <h1>Terms of Service</h1>
        <p className="text-slate-400">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the SafeSphere Platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
          If you disagree with any part, you may not use the Service. These Terms apply to all users: citizens, government
          responders, administrators, and guests.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          SafeSphere is an emergency management platform providing flood prediction, disaster alerts, shelter management,
          resource coordination, evacuation planning, and AI-assisted decision support for government agencies and citizens
          in India. The Service includes web applications, mobile-responsive interfaces, SMS/voice alerts, and API access.
        </p>

        <h2>3. User Accounts & Roles</h2>
        <h3>3.1 Registration</h3>
        <p>
          Certain features require registration. You must provide accurate, complete information and keep credentials
          secure. You are responsible for all activity under your account.
        </p>
        <h3>3.2 Role-Based Access</h3>
        <ul>
          <li><strong>Citizen (Public):</strong> Receive alerts, view shelters, report SOS, family safety status</li>
          <li><strong>Field Responder:</strong> Update shelter occupancy, request resources, log casualties</li>
          <li><strong>District Admin:</strong> Manage district resources, approve broadcasts, view analytics</li>
          <li><strong>Super Admin:</strong> Platform-wide configuration, user management, audit logs</li>
        </ul>
        <p>Government roles require verification (official email domain .gov.in/.nic.in). Unverified accounts receive limited access.</p>

        <h2>4. Acceptable Use</h2>
        <p>You agree NOT to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of Indian law</li>
          <li>Transmit false emergency alerts, spoof SOS signals, or impersonate officials</li>
          <li>Reverse engineer, scrape, or attempt to extract source code or ML models</li>
          <li>Overload the Service (DDoS, automated scripts beyond rate limits)</li>
          <li>Share credentials or transfer accounts</li>
          <li>Use the Service to store/distribute malware, illegal content, or PII of others without consent</li>
        </ul>

        <h2>5. Emergency Disclaimer</h2>
        <p className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-300">
          <strong>CRITICAL:</strong> SafeSphere is a decision-support tool, NOT a replacement for official government
          emergency communications. Predictions, alerts, and AI-generated plans are probabilistic and may be inaccurate.
          Always follow instructions from local authorities (NDMA, SDMA, DDMA, NDRF, IMD, CWC). SafeSphere assumes
          no liability for decisions made based on platform data. In life-threatening emergencies, call 112 (India
          Emergency Response Support System) immediately.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          The Service, its original content, features, and functionality (excluding user-generated content) are owned by
          SafeSphere and protected by Indian and international copyright, trademark, and patent laws. You may not copy,
          modify, distribute, or create derivative works without written permission.
        </p>

        <h2>7. User-Generated Content</h2>
        <p>
          You retain ownership of content you submit (SOS reports, missing person reports, feedback). By submitting,
          you grant SafeSphere a worldwide, royalty-free license to use, display, and process that content for Service
          operation and improvement. You represent you have rights to the content and it does not violate these Terms.
        </p>

        <h2>8. Privacy & Data</h2>
        <p>Your data is governed by our <a href="/privacy" className="text-accent underline">Privacy Policy</a>. By using the Service, you consent to its terms.</p>

        <h2>9. Third-Party Services</h2>
        <p>The Service integrates with:</p>
        <ul>
          <li>Supabase (database, auth, storage)</li>
          <li>Twilio (SMS, voice, WhatsApp)</li>
          <li>Google (OAuth, Translate, Maps)</li>
          <li>OpenRouter/Groq/Bluesminds (AI models)</li>
          <li>OSRM (routing)</li>
        </ul>
        <p>Your use of these services is subject to their respective terms and privacy policies.</p>

        <h2>10. Availability & Maintenance</h2>
        <p>
          We strive for 99.9% uptime but do not guarantee uninterrupted access. Scheduled maintenance windows will be
          announced. During active disasters, we prioritize Service availability for affected regions.
        </p>

        <h2>11. Warranty Disclaimer</h2>
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED,
          INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY OF PREDICTIONS.
        </p>

        <h2>12. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, SAFESPHERE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR LIFE, ARISING FROM USE OR INABILITY TO USE
          THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY. TOTAL LIABILITY SHALL NOT EXCEED ₹10,000 OR AMOUNTS PAID
          BY YOU (IF ANY) IN THE PRECEDING 12 MONTHS.
        </p>

        <h2>13. Indemnification</h2>
        <p>
          You agree to indemnify and hold SafeSphere harmless from claims arising from your breach of these Terms,
          your user content, or your violation of any law or third-party rights.
        </p>

        <h2>14. Termination</h2>
        <p>
          We may suspend or terminate your access immediately for breach of these Terms. You may delete your account
          anytime via Settings. Upon termination, your right to use the Service ceases, but survival clauses (IP,
          disclaimer, liability, indemnification) remain.
        </p>

        <h2>15. Governing Law & Dispute Resolution</h2>
        <p>
          These Terms are governed by the laws of India. Disputes shall be resolved by binding arbitration in New Delhi
          under the Arbitration and Conciliation Act, 1996, in English. Courts of New Delhi have exclusive jurisdiction
          for interim relief.
        </p>

        <h2>16. Government Use</h2>
        <p>
          Government agencies using the Service under official capacity are subject to separate MoUs. These Terms
          supplement, not replace, such agreements.
        </p>

        <h2>17. Changes to Terms</h2>
        <p>We may modify these Terms. Material changes require 30 days&rsquo; notice via in-app banner and email. Continued use after effective date constitutes acceptance.</p>

        <h2>18. Contact</h2>
        <p>
          Questions about these Terms? Contact us at:<br />
          Email: <a href="mailto:safesphere095@gmail.com" className="text-accent underline">safesphere095@gmail.com</a><br />
          Phone: +91-9625130964<br />
          Address: New Delhi, India
        </p>
      </div>
    </main>
  );
}