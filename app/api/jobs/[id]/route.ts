import { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { jobRepo } from "@/server/repositories/job";

export const dynamic = "force-dynamic";

/** GET /api/jobs/:id — job status for polling long-running operations. */
export const GET = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const job = await jobRepo.findById(ctx.params.id);
    if (!job) throw new ApiError("NOT_FOUND", `Job ${ctx.params.id} not found`);
    return ok({
      job: {
        id: job.id,
        jobType: job.jobType,
        status: job.status,
        resultId: job.resultId,
        result: job.resultJson ? JSON.parse(job.resultJson) : null,
        error: job.errorCode
          ? { code: job.errorCode, message: job.errorMessage }
          : null,
        logs: job.logs,
        durationMs: job.durationMs,
      },
    });
  },
);
