// ---------------------------------------------------------------------
// lib/broadcast/strategies/ftp-drop.ts — Phase 4 · Strategy C · FTP audio drop.
//
// For legacy stations whose automation software (Zetta, Rivendell, …)
// polls a watch folder. Uploads the voiced MP3 to the station's FTP server
// under `/emergency/` with the DISASTERLINK_{alertId}_{timestamp}.mp3
// filename, then uploads the CAP XML alongside it so the automation can
// pair the audio with the alert metadata.
//
// Credentials come from the station's emergency_api_endpoint being an
// ftp:// (or sftp://) URL, or from FM_FTP_* env vars for a shared drop.
// ---------------------------------------------------------------------

import type { FmStation } from "@prisma/client";
import { Client } from "basic-ftp";
import { Readable } from "node:stream";
import type { DispatchContext, DispatchResult, FMDispatchStrategy } from "../types";
import { isUsableUrl } from "./cap-api";
export { isUsableUrl };

const EMERGENCY_DIR = "/emergency";

export interface FtpCredentials {
  host: string;
  port: number;
  user: string;
  password: string;
}

/** Parse an ftp:// URL into connection credentials. */
export function parseFtpUrl(url: string): FtpCredentials | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "ftp:" && parsed.protocol !== "ftps:") return null;
    if (!parsed.hostname) return null;
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 21,
      user: parsed.username ? decodeURIComponent(parsed.username) : "anonymous",
      password: parsed.password ? decodeURIComponent(parsed.password) : "",
    };
  } catch {
    return null;
  }
}

/** Strategy C: FTP/SCP audio drop for legacy automation. */
export class FtpDropStrategy implements FMDispatchStrategy {
  readonly name = "ftp" as const;

  /** Requires an ftp:// emergency_api_endpoint or shared FM_FTP_HOST env. */
  supports(station: FmStation): boolean {
    if (isFtpEndpoint(station.emergencyApiEndpoint)) return true;
    return Boolean(process.env.FM_FTP_HOST && station.isActive);
  }

  async send(
    station: FmStation,
    context: DispatchContext,
  ): Promise<DispatchResult> {
    const creds = resolveCredentials(station);
    if (!creds) {
      return {
        ok: false,
        strategy: this.name,
        responseCode: 0,
        responseBody: "No FTP credentials configured for this station.",
        error: "No FTP credentials configured.",
      };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
    const safeAlertId = context.alertId.replace(/[^a-zA-Z0-9_-]/g, "");
    const base = `DISASTERLINK_${safeAlertId}_${timestamp}`;

    const client = new Client();
    client.ftp.verbose = false;

    try {
      await client.access({
        host: creds.host,
        port: creds.port,
        user: creds.user,
        password: creds.password,
        secure: isFtpSecure(station.emergencyApiEndpoint),
      });
      await client.ensureDir(EMERGENCY_DIR);

      await client.uploadFrom(
        toReadable(context.audioBuffer),
        `${EMERGENCY_DIR}/${base}.mp3`,
      );
      await client.uploadFrom(
        toReadable(Buffer.from(context.capAlert.capXml, "utf8")),
        `${EMERGENCY_DIR}/${base}.cap.xml`,
      );

      const responseBody = `Uploaded ${base}.mp3 + ${base}.cap.xml to ${EMERGENCY_DIR}`;
      return {
        ok: true,
        strategy: this.name,
        responseCode: 226,
        responseBody,
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
    } finally {
      client.close();
    }
  }
}

function isFtpEndpoint(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith("ftp://") || value.startsWith("ftps://");
}

function isFtpSecure(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("ftps://"));
}

/** Credentials: per-station ftp URL > shared FM_FTP_* env drop. */
function resolveCredentials(station: FmStation): FtpCredentials | null {
  if (isFtpEndpoint(station.emergencyApiEndpoint)) {
    return parseFtpUrl(station.emergencyApiEndpoint as string);
  }
  if (process.env.FM_FTP_HOST) {
    return {
      host: process.env.FM_FTP_HOST,
      port: Number(process.env.FM_FTP_PORT) || 21,
      user: process.env.FM_FTP_USER ?? "anonymous",
      password: process.env.FM_FTP_PASSWORD ?? "",
    };
  }
  return null;
}

/** Convert a Buffer into the Readable stream basic-ftp expects. */
function toReadable(buffer: Buffer): Readable {
  return Readable.from(buffer);
}
