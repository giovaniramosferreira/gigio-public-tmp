import { z } from "zod";
import { NextRequest } from "next/server";
import { ApiError, handler, jobAccepted, ok } from "@/lib/api";
import { JOB_TYPES, enqueueJob } from "@/lib/jobs";
import { videoRepo } from "@/server/repositories/video";
import { approveVideo, rejectVideo } from "@/server/services/review";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["approve", "reject", "request-rewrite"]),
  notes: z.string().optional(),
  reason: z.string().optional(),
  instructions: z.string().optional(),
});

/**
 * POST /api/review/:id — review decision for a video project.
 * Body: { action: "approve" | "reject" | "request-rewrite", ... }.
 * approve/reject are synchronous; request-rewrite enqueues a script rewrite job.
 */
export const POST = handler(
  async (req: NextRequest, ctx: { params: { id: string } }) => {
    const video = await videoRepo.findById(ctx.params.id);
    if (!video) throw new ApiError("NOT_FOUND", `Video ${ctx.params.id} not found`);

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      throw new ApiError("VALIDATION_ERROR", "Corpo da revisão inválido", parsed.error.issues);
    }
    const { action, notes, reason, instructions } = parsed.data;

    if (action === "approve") {
      await approveVideo(video.id, notes);
      return ok({ status: "approved" });
    }
    if (action === "reject") {
      if (!reason) throw new ApiError("VALIDATION_ERROR", "motivo é obrigatório para rejeitar");
      await rejectVideo(video.id, reason);
      return ok({ status: "rejected" });
    }

    // request-rewrite: send the underlying script back through a rewrite.
    if (!video.scriptPackageId) {
      throw new ApiError("CONFLICT", "Vídeo não tem roteiro para reescrever");
    }
    const jobId = await enqueueJob(
      JOB_TYPES.SCRIPT_REWRITE,
      { scriptId: video.scriptPackageId, instructions },
      { entityType: "script_package", entityId: video.scriptPackageId },
    );
    return jobAccepted(jobId);
  },
);
