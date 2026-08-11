import { ProviderError } from "./types";

export interface WithRetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generic async retry with exponential backoff.
 * Defaults: 3 attempts, base delay 1000ms, doubling each retry.
 * Does not retry on ProviderError with code PROVIDER_NOT_CONFIGURED.
 * Re-throws the last error after exhausting attempts.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: WithRetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Never retry a not-configured error.
      if (
        error instanceof ProviderError &&
        error.code === "PROVIDER_NOT_CONFIGURED"
      ) {
        throw error;
      }

      // No more attempts left.
      if (attempt >= attempts) {
        break;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      options.onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastError;
}

/**
 * Rejects with a ProviderError PROVIDER_TIMEOUT if the promise does not settle
 * within `ms` milliseconds.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new ProviderError(
          "PROVIDER_TIMEOUT",
          `${label} timed out after ${ms}ms`,
        ),
      );
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
