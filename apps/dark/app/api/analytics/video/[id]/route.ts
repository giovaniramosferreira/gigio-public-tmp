import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { analyticsRepo } from "@/server/repositories/analytics";

export const dynamic = "force-dynamic";

/** GET /api/analytics/video/:id — all analytics snapshots for a video. */
export const GET = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const snapshots = await analyticsRepo.listForVideo(ctx.params.id);
    return ok({ snapshots });
  },
);
