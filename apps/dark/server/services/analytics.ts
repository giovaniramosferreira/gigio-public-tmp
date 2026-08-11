import { log } from "@/lib/logger";
import { videoRepo } from "@/server/repositories/video";
import { analyticsRepo } from "@/server/repositories/analytics";

const logger = log("analytics");

export interface AnalyticsInput {
  snapshotDate?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  subscribersGained?: number;
  watchTimeSeconds?: number;
  averageViewDurationSeconds?: number;
  averageViewPercentage?: number;
  impressions?: number;
  ctr?: number;
  revenueUsd?: number;
}

/**
 * Analytics ingestion (FR-16). Records a post-publication performance snapshot
 * for a video. V1 is manual entry / import friendly; a YouTube API sync is a
 * documented post-V1 upgrade. Snapshots are append-only and time-stamped.
 */
export async function ingestSnapshot(
  videoProjectId: string,
  input: AnalyticsInput,
): Promise<string> {
  const video = await videoRepo.findById(videoProjectId);
  if (!video) throw new Error(`Video ${videoProjectId} not found`);

  const snapshot = await analyticsRepo.create({
    videoProject: { connect: { id: videoProjectId } },
    channel: { connect: { id: video.channelId } },
    snapshotDate: input.snapshotDate ? new Date(input.snapshotDate) : new Date(),
    views: input.views ?? 0,
    likes: input.likes ?? 0,
    comments: input.comments ?? 0,
    shares: input.shares ?? 0,
    subscribersGained: input.subscribersGained ?? 0,
    watchTimeSeconds: input.watchTimeSeconds ?? null,
    averageViewDurationSeconds: input.averageViewDurationSeconds ?? null,
    averageViewPercentage: input.averageViewPercentage ?? null,
    impressions: input.impressions ?? null,
    ctr: input.ctr ?? null,
    revenueUsd: input.revenueUsd ?? null,
    rawJson: JSON.stringify(input),
  });

  logger.info({ videoProjectId, snapshotId: snapshot.id }, "analytics snapshot ingested");
  return snapshot.id;
}
