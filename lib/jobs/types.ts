/**
 * Job type registry. Each value maps to a handler and corresponds to the
 * long-running operations exposed by the API (docs/api-contracts.md) and the
 * events in docs/event-model.md.
 */
export const JOB_TYPES = {
  IDEAS_DISCOVER: "ideas.discover",
  IDEA_SCORE: "idea.score",
  SCRIPT_GENERATE: "script.generate",
  SCRIPT_CRITIC: "script.critic",
  SCRIPT_REWRITE: "script.rewrite",
  ASSETS_GENERATE: "assets.generate",
  VOICE_RENDER: "voice.render",
  CAPTIONS_GENERATE: "captions.generate",
  VIDEO_ASSEMBLE: "video.assemble",
  THUMBNAILS_GENERATE: "thumbnails.generate",
  QA_RUN: "qa.run",
  PACKAGE_EXPORT: "package.export",
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export interface JobContext {
  jobId: string;
  /** Append a line to the job's accumulated logs (persisted). */
  log: (message: string) => Promise<void>;
}

export interface JobResult {
  /** ID of the entity created or updated by this job, surfaced to the client. */
  resultId?: string;
  result?: unknown;
}

export type JobHandler<TInput = unknown> = (
  input: TInput,
  ctx: JobContext,
) => Promise<JobResult>;

export interface EnqueueOptions {
  entityType?: string;
  entityId?: string;
}

export class JobError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "JobError";
  }
}
