import { NextRequest } from "next/server";
import { handler, ok } from "@/lib/api";
import { jobRepo } from "@/server/repositories/job";

export const dynamic = "force-dynamic";

/** GET /api/jobs — recent jobs, optionally filtered by status/type. */
export const GET = handler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const jobType = searchParams.get("jobType") ?? undefined;
  const take = Number(searchParams.get("limit") ?? 50);
  const jobs = await jobRepo.list({ status, jobType, take });
  return ok({ jobs });
});
