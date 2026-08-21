import { NextResponse, type NextRequest } from "next/server";
import { safeLog } from "@/lib/logger";
import { BaseApiError } from "@/lib/api/errors";
import { captureException } from "@/lib/monitoring/sentry";

export interface StandardApiErrorPayload {
  error:
    | string
    | {
        code: string;
        message: string;
        details?: unknown;
        requestId: string;
      };
  // Backwards compatibility top-level fields
  ok: false;
  errorId: string;
}

export function handleApiError(
  error: unknown,
  req?: NextRequest | Request | null,
  options: {
    isAuthError?: boolean;
    status?: number;
  } = {}
): NextResponse<StandardApiErrorPayload> {
  const requestId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const isProd = process.env.NODE_ENV === "production";

  let status = options.status;
  let code = "INTERNAL_ERROR";
  let details: unknown = undefined;
  let rawMessage = "";
  let stack: string | undefined = undefined;

  if (error instanceof BaseApiError) {
    status = status ?? error.statusCode;
    code = error.code;
    details = error.details;
    rawMessage = error.message;
    stack = error.stack;
  } else if (error instanceof Error) {
    rawMessage = error.message;
    stack = error.stack;
    if (options.isAuthError || rawMessage.toLowerCase().includes("user not found") || rawMessage.toLowerCase().includes("invalid password")) {
      status = status ?? 401;
      code = "AUTH_ERROR";
    } else {
      status = status ?? 500;
      code = "INTERNAL_ERROR";
    }
  } else {
    rawMessage = String(error ?? "Unknown error");
    status = status ?? 500;
    code = "INTERNAL_ERROR";
  }

  safeLog("error", `API Error [${requestId}]: ${rawMessage}`, {
    action: req?.url ? new URL(req.url).pathname : "API_ROUTE",
    metadata: {
      requestId,
      code,
      status,
      stack,
      rawError: rawMessage,
    },
  });

  // Capture exception in Sentry
  void captureException(error, { requestId, code, status, path: req?.url });

  let clientMessage = "Internal server error";

  if (code === "AUTH_ERROR" || options.isAuthError || rawMessage.toLowerCase().includes("user not found") || rawMessage.toLowerCase().includes("invalid password")) {
    clientMessage = "Invalid credentials";
  } else if (error instanceof BaseApiError) {
    clientMessage = error.message;
  } else if (!isProd) {
    clientMessage = rawMessage;
  }

  const responseBody: StandardApiErrorPayload = {
    ok: false,
    errorId: requestId,
    error: {
      code,
      message: clientMessage,
      requestId,
      ...(details !== undefined ? { details } : !isProd && stack ? { details: stack } : {}),
    },
  };

  return NextResponse.json(responseBody, { status });
}
