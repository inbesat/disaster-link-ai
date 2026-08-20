export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEYS = [
  "password",
  "pass",
  "token",
  "auth",
  "apikey",
  "api_key",
  "secret",
  "phone",
  "phonenumber",
  "phone_number",
  "service_role",
];

const BLOCKED_VALUES = [
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.TWILIO_AUTH_TOKEN,
  process.env.OPENAI_API_KEY,
].filter((val): val is string => Boolean(val && val.length > 3));

function sanitizeValue(key: string, value: unknown): unknown {
  if (typeof value === "string") {
    for (const blocked of BLOCKED_VALUES) {
      if (blocked && value.includes(blocked)) {
        return "[REDACTED_SECRET]";
      }
    }
  }

  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
    return "[REDACTED]";
  }

  if (typeof value === "number") {
    if (lowerKey === "lat" || lowerKey === "latitude" || lowerKey === "lng" || lowerKey === "longitude") {
      return Number(value.toFixed(2));
    }
  }

  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(key, item));
    }
    return sanitizeObject(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = sanitizeValue(key, value);
  }
  return result;
}

export function safeLog(
  level: LogLevel,
  message: string,
  options: {
    userId?: string;
    action?: string;
    metadata?: Record<string, unknown>;
  } = {}
): void {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && level !== "error") {
    return;
  }

  const entry: LogEntry = {
    level,
    message: sanitizeValue("message", message) as string,
    timestamp: new Date().toISOString(),
    ...(options.userId ? { userId: options.userId } : {}),
    ...(options.action ? { action: options.action } : {}),
    ...(options.metadata ? { metadata: sanitizeObject(options.metadata) } : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "info":
      console.info(output);
      break;
    case "debug":
    default:
      console.log(output);
      break;
  }
}
