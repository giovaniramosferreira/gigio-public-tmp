import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { computeInsights } from "@/server/services/learning";

export const dynamic = "force-dynamic";

/** GET /api/analytics/channel/:id — learning-loop insights for a channel. */
export const GET = handler(
  async (_req: NextRequest, ctx: { params: { id: string } }) => {
    const insights = await computeInsights(ctx.params.id);
    return ok({ insights });
  },
);
