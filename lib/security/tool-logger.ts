// ---------------------------------------------------------------------
// lib/security/tool-logger.ts — Phase 10 · Tool call observability
//
// Wraps AI tool execution so every call is logged to the tool_call_logs
// table for cost analysis and debugging. Failures are best-effort — a
// logging failure never breaks the tool itself.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";

type ToolCallInput = {
  toolName: string;
  input?: unknown;
  userId?: string | null;
};

/**
 * Log a tool call to the database. Best-effort: failures are caught and
 * logged to console, never thrown to the caller.
 */
export async function logToolCall(params: ToolCallInput): Promise<void> {
  try {
    await prisma.toolCallLog.create({
      data: {
        toolName: params.toolName,
        input: (params.input as object) ?? {},
        userId: params.userId ?? null,
        success: true,
        durationMs: 0,
      },
    });
  } catch (error) {
    console.warn(`[tool-logger] Failed to log ${params.toolName}:`, error);
  }
}

/**
 * Execute a tool with logging. Wraps the tool function so that:
 *   - Input and output are captured
 *   - Duration is measured
 *   - Success/failure is recorded
 *   - Errors are logged but don't break execution
 */
export async function withToolLogging<T>(
  params: ToolCallInput,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    // Fire-and-forget logging (don't block the response)
    logToolCall({ ...params, input: params.input }).catch(() => {});
    // Log with full details asynchronously
    prisma.toolCallLog.create({
      data: {
        toolName: params.toolName,
        input: (params.input as object) ?? {},
        output: (result as object) ?? {},
        userId: params.userId ?? null,
        success: true,
        durationMs: Date.now() - start,
      },
    }).catch(() => {});
    return result;
  } catch (error) {
    prisma.toolCallLog.create({
      data: {
        toolName: params.toolName,
        input: (params.input as object) ?? {},
        userId: params.userId ?? null,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      },
    }).catch(() => {});
    throw error;
  }
}
