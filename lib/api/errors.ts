export class BaseApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, code: string = "INTERNAL_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class AuthError extends BaseApiError {
  constructor(message: string = "Unauthorized access", details?: unknown) {
    super(message, 401, "AUTH_ERROR", details);
  }
}

export class ValidationError extends BaseApiError {
  constructor(message: string = "Invalid input", details?: Array<{ field: string; message: string }>) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends BaseApiError {
  constructor(message: string = "Resource not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class RateLimitError extends BaseApiError {
  public readonly retryAfterMs?: number;

  constructor(message: string = "Rate limit exceeded", retryAfterMs?: number, details?: unknown) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", details);
    this.retryAfterMs = retryAfterMs;
  }
}

export class InternalError extends BaseApiError {
  constructor(message: string = "Internal server error", details?: unknown) {
    super(message, 500, "INTERNAL_ERROR", details);
  }
}
