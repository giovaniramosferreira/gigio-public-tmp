import { z } from "zod";
import { NextRequest } from "next/server";
import { ApiError, handler, jobAccepted } from "@/lib/api";
import { JOB_TYPES, enqueueJob } from "@/lib/jobs";
import { ideaRepo } from "@/server/repositories/idea";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ ideaId: z.string() });

/** POST /api/scripts/generate — enqueue script generation for an idea. */
export const POST = handler(async (req: NextRequest) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "ideaId is required", parsed.error.issues);
  }

  const idea = await ideaRepo.findById(parsed.data.ideaId);
  if (!idea) throw new ApiError("NOT_FOUND", `Idea ${parsed.data.ideaId} not found`);

  const jobId = await enqueueJob(
    JOB_TYPES.SCRIPT_GENERATE,
    { ideaId: idea.id },
    { entityType: "content_idea", entityId: idea.id },
  );
  return jobAccepted(jobId);
});
