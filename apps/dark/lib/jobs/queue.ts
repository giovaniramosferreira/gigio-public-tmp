import PQueue from "p-queue";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import {
  JobError,
  type EnqueueOptions,
  type JobContext,
  type JobHandler,
  type JobType,
} from "./types";

const logger = log("jobs");

/**
 * In-process job queue (V1) backed by p-queue, with state persisted to the
 * JobRun table. The HTTP layer enqueues a job and returns its id; the client
 * polls GET /api/jobs/:id. Jobs are idempotent at the handler level.
 *
 * Note: an in-process queue does not survive a server restart. Jobs left in
 * RUNNING after a crash are reconciled to FAILED by `recoverStaleJobs()`.
 */

// Survive Next.js dev hot-reload by caching the queue and handler map.
const globalForQueue = globalThis as unknown as {
  __dtQueue?: PQueue;
  __dtHandlers?: Map<JobType, JobHandler>;
};

const queue =
  globalForQueue.__dtQueue ??
  new PQueue({ concurrency: env.JOB_CONCURRENCY });

const handlers: Map<JobType, JobHandler> =
  globalForQueue.__dtHandlers ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.__dtQueue = queue;
  globalForQueue.__dtHandlers = handlers;
}

/** Register a handler for a job type. Call at module init time. */
export function registerHandler<TInput>(
  type: JobType,
  handler: JobHandler<TInput>,
): void {
  handlers.set(type, handler as JobHandler);
}

/** Enqueue a job. Creates a QUEUED JobRun row, returns its id immediately. */
export async function enqueueJob(
  type: JobType,
  input: unknown,
  options: EnqueueOptions = {},
): Promise<string> {
  const job = await prisma.jobRun.create({
    data: {
      jobType: type,
      status: "QUEUED",
      entityType: options.entityType,
      entityId: options.entityId,
      inputJson: JSON.stringify(input ?? null),
    },
  });

  // Fire-and-forget; the queue manages concurrency. Errors are persisted.
  void queue.add(() => runJob(job.id, type, input));

  logger.info({ jobId: job.id, type }, "job enqueued");
  return job.id;
}

async function appendLog(jobId: string, message: string): Promise<void> {
  const line = `[${new Date().toISOString()}] ${message}`;
  const existing = await prisma.jobRun.findUnique({
    where: { id: jobId },
    select: { logs: true },
  });
  const logs = existing?.logs ? `${existing.logs}\n${line}` : line;
  await prisma.jobRun.update({ where: { id: jobId }, data: { logs } });
}

async function runJob(
  jobId: string,
  type: JobType,
  input: unknown,
): Promise<void> {
  const handler = handlers.get(type);
  const startedAt = new Date();

  if (!handler) {
    await prisma.jobRun.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        startedAt,
        completedAt: new Date(),
        errorCode: "NO_HANDLER",
        errorMessage: `Nenhum processador registrado para o tipo de tarefa "${type}"`,
      },
    });
    logger.error({ jobId, type }, "no handler registered");
    return;
  }

  await prisma.jobRun.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt },
  });

  const ctx: JobContext = {
    jobId,
    log: (message: string) => appendLog(jobId, message),
  };

  try {
    const { resultId, result } = await handler(input, ctx);
    const completedAt = new Date();
    await prisma.jobRun.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        resultId,
        resultJson: result !== undefined ? JSON.stringify(result) : null,
      },
    });
    logger.info({ jobId, type, ms: completedAt.getTime() - startedAt.getTime() }, "job completed");
  } catch (err) {
    const completedAt = new Date();
    const code = err instanceof JobError ? err.code : "JOB_FAILED";
    const message = err instanceof Error ? err.message : String(err);
    const details =
      err instanceof JobError && err.details !== undefined
        ? JSON.stringify(err.details)
        : null;
    await prisma.jobRun.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        errorCode: code,
        errorMessage: message,
        errorDetailsJson: details,
      },
    });
    logger.error({ jobId, type, err: message }, "job failed");
  }
}

/**
 * Reconcile jobs stuck in QUEUED/RUNNING from a previous process (the
 * in-process queue does not persist across restarts). Marks them FAILED.
 */
export async function recoverStaleJobs(): Promise<number> {
  const { count } = await prisma.jobRun.updateMany({
    where: { status: { in: ["QUEUED", "RUNNING"] } },
    data: {
      status: "FAILED",
      errorCode: "INTERRUPTED",
      errorMessage: "Tarefa interrompida pelo reinício do servidor",
      completedAt: new Date(),
    },
  });
  if (count > 0) logger.warn({ count }, "recovered stale jobs");
  return count;
}

export function queueStats() {
  return { size: queue.size, pending: queue.pending };
}
