import { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { ideaRepo } from "@/server/repositories/idea";

export const dynamic = "force-dynamic";

/** GET /api/ideas/:id — full idea with pillar and script. */
export const GET = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const idea = await ideaRepo.findById(ctx.params.id);
    if (!idea) throw new ApiError("NOT_FOUND", `Idea ${ctx.params.id} not found`);
    return ok({ idea });
  },
);
