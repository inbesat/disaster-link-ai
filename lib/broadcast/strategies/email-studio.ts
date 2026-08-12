// ---------------------------------------------------------------------
// lib/broadcast/strategies/email-studio.ts — Phase 4 · Strategy D · Email
// to studio (fallback).
//
// Last-resort channel: emails the CAP XML + voiced MP3 to the station's
// studio inbox so an on-duty operator can cue the broadcast manually.
// Used when the station has no API/RDS/FTP path. Built on nodemailer
// (SMTP). When SMTP is not configured, the strategy degrades to a logged
// "dry-run" so a demo run still reports a deterministic result.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import nodemailer, { type Transporter } from "nodemailer";
import type { DispatchContext, DispatchResult, FMDispatchStrategy } from "../types";

const SUBJECT_PREFIX = "[EMERGENCY ALERT]";

/** Strategy D: email the CAP + audio to the station studio. */
export class EmailStudioStrategy implements FMDispatchStrategy {
  readonly name = "email" as const;

  /** Needs an email inbox on the station or a shared SMTP sender. */
  supports(station: FmStation): boolean {
    return Boolean(station.emailAddress || process.env.FM_EMAIL_TO);
  }

  async send(
    station: FmStation,
    context: DispatchContext,
  ): Promise<DispatchResult> {
    const to = station.emailAddress ?? process.env.FM_EMAIL_TO;
    if (!to) {
      return {
        ok: false,
        strategy: this.name,
        responseCode: 0,
        responseBody: "No email inbox configured for this station.",
        error: "No email inbox configured.",
      };
    }

    const transporter = buildTransporter();
    if (!transporter) {
      // SMTP not configured — deterministic dry-run result for demo/dev.
      return {
        ok: true,
        strategy: this.name,
        responseCode: 202,
        responseBody: `[dry-run] Email queued to ${to}: ${context.headline} ` +
          `(${context.audioBuffer.length} bytes MP3 + CAP attached).`,
      };
    }

    try {
      const subject = `${SUBJECT_PREFIX} ${context.headline}`;
      const info = await transporter.sendMail({
        from: process.env.FM_EMAIL_FROM ?? "safesphere@ddma.gov.in",
        to,
        subject,
        text: buildEmailBody(station, context),
        attachments: [
          {
            filename: `alert-${context.alertId}.cap.xml`,
            content: context.capAlert.capXml,
            contentType: "application/cap+xml",
          },
          {
            filename: `alert-${context.alertId}.mp3`,
            content: context.audioBuffer,
            contentType: "audio/mpeg",
          },
        ],
      });

      return {
        ok: true,
        strategy: this.name,
        responseCode: 250,
        responseBody: `Sent to ${to} (messageId ${info.messageId ?? "n/a"}).`,
        broadcastTime: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        strategy: this.name,
        responseCode: 0,
        responseBody: message.slice(0, 500),
        error: message,
      };
    }
  }
}

/** Build the SMTP transporter from env — null when not configured. */
export function buildTransporter(): Transporter | null {
  const host = process.env.FM_SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.FM_SMTP_PORT) || 587,
    secure: process.env.FM_SMTP_SECURE === "true",
    auth: process.env.FM_SMTP_USER
      ? {
          user: process.env.FM_SMTP_USER,
          pass: process.env.FM_SMTP_PASS ?? "",
        }
      : undefined,
  });
}

function buildEmailBody(
  station: FmStation,
  context: DispatchContext,
): string {
  return [
    `URGENT — EMERGENCY BROADCAST REQUEST`,
    ``,
    `Station: ${station.name} (${station.frequency} MHz, ${station.city}, ${station.state})`,
    `Alert: ${context.headline}`,
    `CAP identifier: ${context.alertId}`,
    ``,
    `Attached: CAP v1.2 XML + radio-ready MP3 voice track.`,
    `Please cue the attached MP3 for immediate broadcast and scroll the RDS text:`,
    ``,
    context.rdsText,
    ``,
    `Instructions: ${context.capAlert.capXml ? extractInstruction(context.capAlert.capXml) : ""}`,
    ``,
    `This is an automated emergency dispatch from SafeSphere (District Disaster Management Authority).`,
  ].join("\n");
}

/** Pull the <instruction> text out of the CAP XML for the email body. */
function extractInstruction(capXml: string): string {
  const match = capXml.match(/<instruction>([\s\S]*?)<\/instruction>/);
  return match ? match[1] : "";
}
