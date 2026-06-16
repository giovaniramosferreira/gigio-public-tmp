import { NextResponse } from "next/server";
import { ensureInitialized } from "@/lib/init";
import { log } from "@/lib/logger";

const logger = log("api");

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PROVIDER_ERROR"
  | "PROVIDER_TIMEOUT"
  | "ORIGINALITY_BLOCKED"
  | "QA_BLOCKED"
  | "MISSING_ASSET"
  | "JOB_FAILED"
  | "INTERNAL";

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PROVIDER_ERROR: 502,
  PROVIDER_TIMEOUT: 504,
  ORIGINALITY_BLOCKED: 409,
  QA_BLOCKED: 409,
  MISSING_ASSET: 409,
  JOB_FAILED: 500,
  INTERNAL: 500,
};

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jobAccepted(jobId: string) {
  return NextResponse.json({ jobId, status: "queued" }, { status: 202 });
}

export function fail(code: ApiErrorCode, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status: STATUS[code] });
}

/**
 * Wrap a route handler: ensures bootstrap has run and maps thrown errors to the
 * standard error envelope. Handlers can throw ApiError for typed responses.
 */
export function handler<T extends unknown[]>(
  fn: (...args: T) => Promise<Response>,
) {
  return async (...args: T): Promise<Response> => {
    try {
      await ensureInitialized();
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return fail(err.code, err.message, err.details);
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err: message }, "unhandled api error");
      return fail("INTERNAL", message);
    }
  };
}
