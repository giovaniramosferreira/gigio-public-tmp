import { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { videoRepo } from "@/server/repositories/video";
import { assetPlanRepo, captionRepo } from "@/server/repositories/production";

export const dynamic = "force-dynamic";

/** GET /api/videos/:id — full video project with production children. */
export const GET = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const video = await videoRepo.findById(ctx.params.id);
    if (!video) throw new ApiError("NOT_FOUND", `Video ${ctx.params.id} not found`);

    const scriptId = video.scriptPackageId ?? undefined;
    const [assetPlan, captions] = scriptId
      ? await Promise.all([
          assetPlanRepo.findByScript(scriptId),
          captionRepo.findByScript(scriptId),
        ])
      : [null, null];

    const latestQa = video.qaRuns[0] ?? null;
    return ok({
      video,
      assetPlan,
      captions,
      qa: latestQa
        ? {
            ...latestQa,
            reasonCodes: latestQa.reasonCodesJson ? JSON.parse(latestQa.reasonCodesJson) : [],
            report: latestQa.reportJson ? JSON.parse(latestQa.reportJson) : null,
          }
        : null,
      metadata: video.metadata,
      thumbnails: video.thumbnails,
      publishPackage: video.publishPackage,
    });
  },
);
