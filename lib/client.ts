"use client";

/**
 * Minimal client-side API helpers for the operator UI. Centralizes fetch
 * boilerplate and the long-running job polling contract (docs/api-contracts.md).
 */

export interface JobView {
  id: string;
  jobType: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  resultId: string | null;
  result: unknown;
  error: { code: string; message: string } | null;
  logs: string | null;
  durationMs: number | null;
}

async function parse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      json?.error?.message ?? `Requisição falhou com status ${res.status}`;
    throw new Error(message);
  }
  return json as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return parse<T>(await fetch(path, { cache: "no-store" }));
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return parse<T>(
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }),
  );
}

/** Enqueue a job (POST returning { jobId }) and resolve when it settles. */
export async function runJob(
  path: string,
  body?: unknown,
  opts: { intervalMs?: number; timeoutMs?: number; onTick?: (job: JobView) => void } = {},
): Promise<JobView> {
  const { intervalMs = 1500, timeoutMs = 300_000, onTick } = opts;
  const { jobId } = await apiPost<{ jobId: string }>(path, body);

  const deadline = Date.now() + timeoutMs;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const { job } = await apiGet<{ job: JobView }>(`/api/jobs/${jobId}`);
    onTick?.(job);
    if (job.status === "COMPLETED" || job.status === "FAILED") return job;
    if (Date.now() > deadline) throw new Error("Job expirou");
  }
}
