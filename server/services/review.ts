import { log } from "@/lib/logger";
import { videoRepo } from "@/server/repositories/video";
import { publishRepo } from "@/server/repositories/production";

const logger = log("review");

/**
 * Review workflow (FR-13). All publishing is review-before-publish in V1: a
 * human must approve before a package can be exported. Approve/reject/rewrite
 * are the only transitions out of REVIEW_READY.
 */

export async function approveVideo(videoProjectId: string, notes?: string): Promise<void> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project) throw new Error(`Video ${videoProjectId} not found`);

  const latestQa = project.qaRuns[0];
  if (latestQa?.decision === "BLOCK") {
    throw new Error("Cannot approve a video that QA marked BLOCK without resolving the block");
  }

  await publishRepo.upsertForVideo(videoProjectId, {
    approvalStatus: "APPROVED",
    approvedBy: "operator",
    approvedAt: new Date(),
    manualUploadNotes: notes ?? null,
    status: "PENDING",
  });
  await videoRepo.update(videoProjectId, { status: "APPROVED" });
  logger.info({ videoProjectId }, "video approved");
}

export async function rejectVideo(videoProjectId: string, reason: string): Promise<void> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project) throw new Error(`Video ${videoProjectId} not found`);

  await publishRepo.upsertForVideo(videoProjectId, {
    approvalStatus: "REJECTED",
    manualUploadNotes: reason,
    status: "FAILED",
  });
  await videoRepo.update(videoProjectId, { status: "REVIEW_READY", notes: `Rejected: ${reason}` });
  logger.info({ videoProjectId, reason }, "video rejected");
}
