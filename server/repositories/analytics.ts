import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** AnalyticsSnapshot repository (FR-16). */
export const analyticsRepo = {
  create(data: Prisma.AnalyticsSnapshotCreateInput) {
    return prisma.analyticsSnapshot.create({ data });
  },

  listForVideo(videoProjectId: string) {
    return prisma.analyticsSnapshot.findMany({
      where: { videoProjectId },
      orderBy: { snapshotDate: "desc" },
    });
  },

  /** Latest snapshot per video for a channel, used by the learning loop. */
  listLatestForChannel(channelId: string, take = 200) {
    return prisma.analyticsSnapshot.findMany({
      where: { channelId },
      orderBy: { snapshotDate: "desc" },
      take,
      include: {
        videoProject: {
          include: {
            scriptPackage: { include: { contentIdea: { include: { pillar: true } } } },
          },
        },
      },
    });
  },
};
