import { NextRequest } from "next/server";
import { ApiError, handler, jobAccepted } from "@/lib/api";
import { JOB_TYPES, enqueueJob, type JobType } from "@/lib/jobs";
import { videoRepo } from "@/server/repositories/video";

export const dynamic = "force-dynamic";

/** Map a production step path segment to its job type. */
const STEP_JOBS: Record<string, JobType> = {
  assets: JOB_TYPES.ASSETS_GENERATE,
  voice: JOB_TYPES.VOICE_RENDER,
  captions: JOB_TYPES.CAPTIONS_GENERATE,
  assemble: JOB_TYPES.VIDEO_ASSEMBLE,
  thumbnails: JOB_TYPES.THUMBNAILS_GENERATE,
  metadata: JOB_TYPES.METADATA_GENERATE,
  qa: JOB_TYPES.QA_RUN,
  export: JOB_TYPES.PACKAGE_EXPORT,
};

/**
 * POST /api/videos/:id/:step — enqueue a production-pipeline step for a video
 * project. Returns a jobId for polling. Step is one of:
 * assets | voice | captions | assemble | thumbnails | metadata | qa | export.
 */
export const POST = handler(
  async (req: NextRequest, ctx: { params: { id: string; step: string } }) => {
    const jobType = STEP_JOBS[ctx.params.step];
    if (!jobType) {
      throw new ApiError("VALIDATION_ERROR", `Unknown production step "${ctx.params.step}"`);
    }
    const video = await videoRepo.findById(ctx.params.id);
    if (!video) throw new ApiError("NOT_FOUND", `Video ${ctx.params.id} not found`);

    const body = (await req.json().catch(() => ({}))) as { voiceId?: string };
    const jobId = await enqueueJob(
      jobType,
      { videoProjectId: video.id, voiceId: body.voiceId },
      { entityType: "video_project", entityId: video.id },
    );
    return jobAccepted(jobId);
  },
);
