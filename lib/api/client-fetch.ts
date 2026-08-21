import { BaseApiError } from "@/lib/api/errors";

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface StandardErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[] | unknown;
    requestId?: string;
  };
  // Fallback top-level properties
  errorId?: string;
  message?: string;
}

export interface ClientFetchOptions extends RequestInit {
  retries?: number;
  retryDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Standard client API fetch wrapper.
 *  - Handles network failures with auto-retry + backoff.
 *  - Parses standardized API error JSON.
 *  - Throws typed Error or BaseApiError with parsed server details.
 */
export async function clientFetch<T = unknown>(
  url: string,
  options: ClientFetchOptions = {}
): Promise<T> {
  const { retries = 2, retryDelayMs = 1000, onRetry, ...fetchInit } = options;

  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, fetchInit);

      if (!response.ok) {
        let errorBody: StandardErrorBody | null = null;
        try {
          errorBody = await response.json();
        } catch {
          // Response was not JSON
        }

        const code = errorBody?.error?.code ?? (response.status === 401 ? "AUTH_ERROR" : response.status === 429 ? "RATE_LIMIT_EXCEEDED" : "API_ERROR");
        const message = errorBody?.error?.message ?? errorBody?.message ?? `Request failed with status ${response.status}`;
        const details = errorBody?.error?.details;

        const error = new BaseApiError(message, response.status, code, details);

        // Don't retry client errors (4xx) except 429 rate limits when appropriate
        if (response.status < 500 && response.status !== 429) {
          throw error;
        }

        if (attempt < retries) {
          attempt++;
          if (onRetry) onRetry(attempt, error);
          await new Promise((res) => setTimeout(res, retryDelayMs * Math.pow(2, attempt - 1)));
          continue;
        }

        throw error;
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      const isNetworkError =
        err instanceof TypeError ||
        (err instanceof Error && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")));

      if (isNetworkError && attempt < retries) {
        attempt++;
        const netErr = new Error("Connection lost. Retrying...");
        if (onRetry) onRetry(attempt, netErr);
        await new Promise((res) => setTimeout(res, retryDelayMs * Math.pow(2, attempt - 1)));
        continue;
      }

      if (isNetworkError) {
        throw new Error("Connection lost. Please check your network connection.");
      }

      throw err;
    }
  }
}
