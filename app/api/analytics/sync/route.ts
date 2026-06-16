import { z } from "zod";
import { NextRequest } from "next/server";
import { ApiError, handler, ok } from "@/lib/api";
import { ingestSnapshot } from "@/server/services/analytics";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  videoProjectId: z.string(),
  data: z
    .object({
      snapshotDate: z.string().optional(),
      views: z.number().nonnegative().optional(),
      likes: z.number().nonnegative().optional(),
      comments: z.number().nonnegative().optional(),
      shares: z.number().nonnegative().optional(),
      subscribersGained: z.number().optional(),
      watchTimeSeconds: z.number().optional(),
      averageViewDurationSeconds: z.number().optional(),
      averageViewPercentage: z.number().min(0).max(100).optional(),
      impressions: z.number().optional(),
      ctr: z.number().min(0).max(1).optional(),
      revenueUsd: z.number().optional(),
    })
    .default({}),
});

/** POST /api/analytics/sync — ingest a manual analytics snapshot for a video. */
export const POST = handler(async (req: NextRequest) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Invalid analytics body", parsed.error.issues);
  }
  const snapshotId = await ingestSnapshot(parsed.data.videoProjectId, parsed.data.data);
  return ok({ snapshotId }, 201);
});
