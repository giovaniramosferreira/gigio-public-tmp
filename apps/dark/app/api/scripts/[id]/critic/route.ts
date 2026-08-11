import { NextRequest } from "next/server";
import { ApiError, handler, jobAccepted } from "@/lib/api";
import { JOB_TYPES, enqueueJob } from "@/lib/jobs";
import { scriptRepo } from "@/server/repositories/script";

export const dynamic = "force-dynamic";

/** POST /api/scripts/:id/critic — enqueue a critic pass. */
export const POST = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const script = await scriptRepo.findById(ctx.params.id);
    if (!script) throw new ApiError("NOT_FOUND", `Script ${ctx.params.id} not found`);
    const jobId = await enqueueJob(
      JOB_TYPES.SCRIPT_CRITIC,
      { scriptId: script.id },
      { entityType: "script_package", entityId: script.id },
    );
    return jobAccepted(jobId);
  },
);
