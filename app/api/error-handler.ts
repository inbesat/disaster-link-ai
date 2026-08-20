import { NextResponse, type NextRequest } from "next/server";
import { safeLog } from "@/lib/logger";

export interface ApiErrorResponse {
  ok: false;
  error: string;
  errorId: string;
  details?: unknown;
}

export function handleApiError(
  error: unknown,
  req?: NextRequest | Request | null,
  options: {
    isAuthError?: boolean;
    status?: number;
  } = {}
): NextResponse<ApiErrorResponse> {
  const errorId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const isProd = process.env.NODE_ENV === "production";
  const status = options.status ?? (options.isAuthError ? 401 : 500);

  const rawMessage = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const stack = error instanceof Error ? error.stack : undefined;

  safeLog("error", `API Error [${errorId}]: ${rawMessage}`, {
    action: req?.url ? new URL(req.url).pathname : "API_ROUTE",
    metadata: {
      errorId,
      stack,
      rawError: rawMessage,
    },
  });

  let clientMessage = "Internal server error";

  if (options.isAuthError || rawMessage.toLowerCase().includes("user not found") || rawMessage.toLowerCase().includes("invalid password")) {
    clientMessage = "Invalid credentials";
  } else if (!isProd) {
    clientMessage = rawMessage;
  }

  const responseBody: ApiErrorResponse = {
    ok: false,
    error: clientMessage,
    errorId,
    ...(!isProd && !options.isAuthError && stack ? { details: stack } : {}),
  };

  return NextResponse.json(responseBody, { status });
}
