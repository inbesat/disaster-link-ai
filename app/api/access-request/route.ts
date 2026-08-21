import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createRateLimiter } from "@/lib/security/rate-limit";
import { prisma } from "@/server/prisma";

// ---------------------------------------------------------------------
// app/api/access-request/route.ts — Gov portal "Request access" gate.
//
// Every /gov/signup submission lands here:
//   1. Persisted to the access_requests table (upsert on email — a
//      re-submission resets the row to pending instead of duplicating).
//   2. Emailed to the team inbox WITH the uploaded ID document attached,
//      so an admin can verify identity straight from Gmail.
//
// Transport: Gmail SMTP via nodemailer (same as /api/demo-request):
//   SMTP_USER=team@gmail.com          (the SENDER gmail account)
//   SMTP_PASS=<16-char app password>  (myaccount.google.com/apppasswords)
// Optional recipient override:
//   ACCESS_REQUEST_EMAILS=a@gmail.com,b@gmail.com
//
// Resilience: if SMTP is down but the DB write succeeded, the request is
// still recorded and visible in /access-requests — we only fail the client
// when BOTH channels are unavailable, so no request is ever silently lost.
// ---------------------------------------------------------------------

export const maxDuration = 30;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 3;

const MAX_ID_BYTES = 5 * 1024 * 1024; // 5 MB cap for the ID attachment
const ALLOWED_ID_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Gov roles a request may ask for (super_admin is never self-requestable). */
const REQUESTABLE_ROLES = new Set(["field_responder", "district_admin"]);

const DEFAULT_RECIPIENTS = ["safesphere095@gmail.com", "anonymous4w08@gmail.com"];

function recipients(): string[] {
  const raw = process.env.ACCESS_REQUEST_EMAILS ?? process.env.DEMO_REQUEST_EMAILS;
  if (!raw) return DEFAULT_RECIPIENTS;
  const parsed = raw
    .split(",")
    .map((e) => e.trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  return parsed.length > 0 ? parsed : DEFAULT_RECIPIENTS;
}

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  return `access-request:${ip}`;
}

function clean(value: unknown, maxLen: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLen) : "";
}

export async function POST(req: NextRequest) {
  const rate = createRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS)(
    clientKey(req),
  );
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many requests — please try again in a minute." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid submission format." },
      { status: 400 },
    );
  }

  const name = clean(form.get("name"), 120);
  const email = clean(form.get("email"), 200).toLowerCase();
  const organization = clean(form.get("organization"), 160);
  const requestedRoleRaw = clean(form.get("requestedRole"), 40);
  const message = clean(form.get("message"), 1000);
  const requestedRole = REQUESTABLE_ROLES.has(requestedRoleRaw)
    ? requestedRoleRaw
    : "field_responder";

  if (!name || !organization || !email) {
    return NextResponse.json(
      { error: "Name, official email and organisation are required." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid official email address." },
      { status: 400 },
    );
  }

  // ---- ID document (required by the form; validated defensively here) ----
  const idFile = form.get("idFile");
  let idFileName: string | null = null;
  let attachment: { filename: string; content: Buffer; contentType: string } | null = null;

  if (idFile instanceof File && idFile.size > 0) {
    if (idFile.size > MAX_ID_BYTES) {
      return NextResponse.json(
        { error: "ID document must be under 5 MB." },
        { status: 400 },
      );
    }
    if (!ALLOWED_ID_TYPES.has(idFile.type)) {
      return NextResponse.json(
        { error: "ID document must be a JPG, PNG, WebP or PDF file." },
        { status: 400 },
      );
    }
    idFileName = idFile.name.slice(0, 200);
    attachment = {
      filename: idFileName,
      content: Buffer.from(await idFile.arrayBuffer()),
      contentType: idFile.type,
    };
  }

  // ---- 1. Persist (best-effort — email still goes out if this fails) ----
  let dbOk = false;
  try {
    await prisma.accessRequest.upsert({
      where: { email },
      update: {
        name,
        organization,
        requestedRole,
        idFileName,
        message: message || null,
        status: "pending",
        decidedAt: null,
      },
      create: {
        name,
        email,
        organization,
        requestedRole,
        idFileName,
        message: message || null,
      },
    });
    dbOk = true;
  } catch (error) {
    // Placeholder DATABASE_URL or table not migrated yet — log loudly and
    // continue to the email channel so nothing is silently lost.
    console.warn(
      "[access-request] DB persist failed (table missing or DATABASE_URL unset?) — continuing via email.",
      error instanceof Error ? error.message.split("\n")[0] : error,
    );
  }

  // ---- 2. Email with attachment (same transport as demo-request) ----
  const subject = `Gov Access Request — ${organization} (${name})`;
  const text = [
    "NEW GOV PORTAL ACCESS REQUEST — SafeSphere",
    "",
    `Name:         ${name}`,
    `Email:        ${email}`,
    `Organisation: ${organization}`,
    `Requested role: ${requestedRole}`,
    `ID document:  ${idFileName ? `${idFileName} (attached)` : "(none)"}`,
    "",
    message ? `Message:\n${message}` : "No additional message.",
    "",
    `Received: ${new Date().toISOString()}`,
    dbOk
      ? "Recorded in access_requests — approve/reject at /access-requests."
      : "⚠ NOT recorded in DB (write failed) — approve manually once DB is available.",
  ].join("\n");

  let mailOk = false;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: smtpUser, pass: smtpPass },
      });
      const info = await transporter.sendMail({
        from: `"SafeSphere Access Requests" <${smtpUser}>`,
        to: recipients().join(", "),
        replyTo: email,
        subject,
        text,
        ...(attachment ? { attachments: [attachment] } : {}),
      });
      mailOk = true;
      console.info(
        `[access-request] mailed to ${recipients().join(", ")} (id ${info.messageId})`,
      );
    } catch (error) {
      console.error("[access-request] failed to send email:", error);
    }
  } else {
    console.warn(
      "[access-request] ⚠ SMTP not configured (set SMTP_USER + SMTP_PASS). Request logged below instead of emailed.",
    );
    console.info(`[access-request] ${subject}\n${text}`);
  }

  if (!dbOk && !mailOk) {
    return NextResponse.json(
      { error: "Could not submit your request right now. Please email us directly at safesphere095@gmail.com." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, recorded: dbOk, emailed: mailOk });
}
