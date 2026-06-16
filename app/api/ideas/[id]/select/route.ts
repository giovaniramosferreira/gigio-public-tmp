import { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { ideaRepo } from "@/server/repositories/idea";

export const dynamic = "force-dynamic";

/** POST /api/ideas/:id/select — mark an idea SELECTED, ready for scripting. */
export const POST = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const idea = await ideaRepo.findById(ctx.params.id);
    if (!idea) throw new ApiError("NOT_FOUND", `Idea ${ctx.params.id} not found`);
    const updated = await ideaRepo.update(idea.id, { status: "SELECTED" });
    return ok({ idea: updated });
  },
);
