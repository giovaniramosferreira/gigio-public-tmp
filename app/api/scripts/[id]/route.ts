import { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { scriptRepo } from "@/server/repositories/script";

export const dynamic = "force-dynamic";

/** GET /api/scripts/:id — full script package with parsed JSON fields. */
export const GET = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const script = await scriptRepo.findById(ctx.params.id);
    if (!script) throw new ApiError("NOT_FOUND", `Script ${ctx.params.id} not found`);
    return ok({
      script,
      hookVariants: script.hookVariantsJson ? JSON.parse(script.hookVariantsJson) : [],
      beatPlan: script.beatPlanJson ? JSON.parse(script.beatPlanJson) : [],
      criticNotes: script.criticNotesJson ? JSON.parse(script.criticNotesJson) : null,
    });
  },
);
