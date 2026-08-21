import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createRateLimiter } from "@/lib/security/rate-limit";

// ---------------------------------------------------------------------
// app/api/demo-request/route.ts — landing-page "Request Demo" form.
//
// Mails every submission to the SafeSphere team inbox(es):
//   safesphere095@gmail.com (default) + anonymous4w08@gmail.com
//
// Transport: Gmail SMTP via nodemailer. Requires an app password:
//   SMTP_USER=team@gmail.com          (the SENDER gmail account)
//   SMTP_PASS=<16-char app password>  (myaccount.google.com/apppasswords)
// Optional override of recipients (comma-separated):
//   DEMO_REQUEST_EMAILS=a@gmail.com,b@gmail.com
//
// If SMTP is not configured the request is still logged loudly to the
// server console (never silently lost) and the client falls back to a
// prefilled mailto: link.
// ---------------------------------------------------------------------

export const maxDuration = 30;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;

const demoLimiter = createRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

/** Team inboxes that receive every demo request. */
const DEFAULT_RECIPIENTS = ["safesphere095@gmail.com", "anonymous4w08@gmail.com"];

function recipients(): string[] {
  const raw = process.env.DEMO_REQUEST_EMAILS;
  if (!raw) return DEFAULT_RECIPIENTS;
  const parsed = raw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  return parsed.length > 0 ? parsed : DEFAULT_RECIPIENTS;
}

function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  return `demo-request:${ip}`;
}

/** Trim + cap every field so a hostile payload can't blow up the email. */
function clean(value: unknown, maxLen: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLen) : "";
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const rate = demoLimiter(clientKey(req));
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many requests — please try again in a minute." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const organization = clean(body.organization, 160);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const role = clean(body.role, 60);
  const message = clean(body.message, 4000);

  if (!name || !organization || !email || !phone || !role || !message) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address." },
      { status: 400 },
    );
  }

  const subject = `Demo Request — ${organization} (${role})`;
  const text = [
    "NEW DEMO REQUEST — SafeSphere landing page",
    "",
    `Name:         ${name}`,
    `Organization: ${organization}`,
    `Email:        ${email}`,
    `Phone:        ${phone}`,
    `Role:         ${role}`,
    "",
    "Message:",
    message,
    "",
    `Received: ${new Date().toISOString()}`,
  ].join("\n");

  // No SMTP credentials → log the full request so it's visible in the
  // server terminal / Vercel logs, and tell the client to use the mailto
  // fallback instead of pretending the email was delivered.
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.warn(
      "[demo-request] ⚠ SMTP not configured (set SMTP_USER + SMTP_PASS). " +
        "Request logged below instead of emailed.",
    );
    console.info(`[demo-request] ${subject}\n${text}`);
    return NextResponse.json(
      {
        error: "Email service is not configured.",
        logged: true,
      },
      { status: 503 },
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: `"SafeSphere Demo Requests" <${smtpUser}>`,
      to: recipients().join(", "),
      replyTo: email,
      subject,
      text,
    });

    console.info(`[demo-request] mailed to ${recipients().join(", ")} (id ${info.messageId})`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[demo-request] failed to send email:", error);
    return NextResponse.json(
      { error: "Failed to send your request. Please email us directly." },
      { status: 502 },
    );
  }
}
