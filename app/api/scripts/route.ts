import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { scriptRepo } from "@/server/repositories/script";

export const dynamic = "force-dynamic";

/** GET /api/scripts — list script packages, optionally filtered by status. */
export const GET = handler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const take = Number(searchParams.get("limit") ?? 50);
  const scripts = await scriptRepo.list({ status, take });
  return ok({ scripts });
});
