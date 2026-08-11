import { z } from "zod";
import { NextRequest } from "next/server";
import { ApiError, handler, jobAccepted } from "@/lib/api";
import { JOB_TYPES, enqueueJob } from "@/lib/jobs";
import { scriptRepo } from "@/server/repositories/script";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ instructions: z.string().optional() });

/** POST /api/scripts/:id/rewrite — enqueue a rewrite incorporating critique. */
export const POST = handler(
  async (req: NextRequest, ctx: { params: { id: string } }) => {
    const script = await scriptRepo.findById(ctx.params.id);
    if (!script) throw new ApiError("NOT_FOUND", `Script ${ctx.params.id} not found`);
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    const instructions = parsed.success ? parsed.data.instructions : undefined;

    const jobId = await enqueueJob(
      JOB_TYPES.SCRIPT_REWRITE,
      { scriptId: script.id, instructions },
      { entityType: "script_package", entityId: script.id },
    );
    return jobAccepted(jobId);
  },
);
