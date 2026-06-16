import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { videoRepo } from "@/server/repositories/video";

export const dynamic = "force-dynamic";

/** GET /api/videos — list video projects, optionally filtered by status. */
export const GET = handler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const take = Number(searchParams.get("limit") ?? 50);
  const videos = await videoRepo.list({ status, take });
  return ok({ videos });
});
