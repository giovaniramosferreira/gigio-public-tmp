import { z } from "zod";
import { NextRequest } from "next/server";
import { ApiError, handler, jobAccepted } from "@/lib/api";
import { JOB_TYPES, enqueueJob } from "@/lib/jobs";
import { channelRepo } from "@/server/repositories/channel";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  channelId: z.string().optional(),
  pillarId: z.string().optional(),
  seedPhrases: z.string().optional(),
  count: z.number().int().min(25).max(60).optional(),
});

/** POST /api/ideas/discover — enqueue a discovery job. Returns a jobId. */
export const POST = handler(async (req: NextRequest) => {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    throw new ApiError("VALIDATION_ERROR", "Corpo da requisição inválido", parsed.error.issues);
  }

  let channelId = parsed.data.channelId;
  if (!channelId) {
    const active = await channelRepo.findActive();
    if (!active) throw new ApiError("NOT_FOUND", "Nenhum canal ativo configurado");
    channelId = active.id;
  }

  const jobId = await enqueueJob(
    JOB_TYPES.IDEAS_DISCOVER,
    { ...parsed.data, channelId },
    { entityType: "channel", entityId: channelId },
  );
  return jobAccepted(jobId);
});
