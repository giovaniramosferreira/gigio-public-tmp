import { NextRequest } from "next/server";
import { ApiError, handler, jobAccepted } from "@/lib/api";
import { JOB_TYPES, enqueueJob } from "@/lib/jobs";
import { scriptRepo } from "@/server/repositories/script";

export const dynamic = "force-dynamic";

/**
 * POST /api/scripts/:id/approve — approve a script for production and create its
 * VideoProject (enqueued). Returns a jobId; result.videoProjectId on completion.
 */
export const POST = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const script = await scriptRepo.findById(ctx.params.id);
    if (!script) throw new ApiError("NOT_FOUND", `Script ${ctx.params.id} not found`);
    if (script.status === "BLOCKED") {
      throw new ApiError("ORIGINALITY_BLOCKED", "Roteiro está BLOQUEADO e não pode entrar em produção");
    }
    const jobId = await enqueueJob(
      JOB_TYPES.PRODUCTION_START,
      { scriptId: script.id },
      { entityType: "script_package", entityId: script.id },
    );
    return jobAccepted(jobId);
  },
);
