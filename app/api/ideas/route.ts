import { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { channelRepo } from "@/server/repositories/channel";
import { ideaRepo } from "@/server/repositories/idea";

export const dynamic = "force-dynamic";

/** GET /api/ideas — list ideas for the active (or given) channel. */
export const GET = handler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  let channelId = searchParams.get("channelId") ?? undefined;
  if (!channelId) {
    const active = await channelRepo.findActive();
    if (!active) throw new ApiError("NOT_FOUND", "No active channel configured");
    channelId = active.id;
  }

  const status = searchParams.get("status") ?? undefined;
  const pillarId = searchParams.get("pillarId") ?? undefined;
  const take = Number(searchParams.get("limit") ?? 50);

  const ideas = await ideaRepo.list({ channelId, status, pillarId, take });
  return ok({ ideas });
});
