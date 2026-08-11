import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** ContentIdea repository. */
export const ideaRepo = {
  create(data: Prisma.ContentIdeaCreateInput) {
    return prisma.contentIdea.create({ data });
  },

  createMany(data: Prisma.ContentIdeaCreateManyInput[]) {
    return prisma.contentIdea.createMany({ data });
  },

  findById(id: string) {
    return prisma.contentIdea.findUnique({
      where: { id },
      include: { pillar: true, script: true },
    });
  },

  list(params: {
    channelId: string;
    status?: string;
    pillarId?: string;
    take?: number;
    skip?: number;
  }) {
    const { channelId, status, pillarId, take = 50, skip = 0 } = params;
    return prisma.contentIdea.findMany({
      where: { channelId, ...(status ? { status } : {}), ...(pillarId ? { pillarId } : {}) },
      include: { pillar: true },
      orderBy: [{ totalScore: "desc" }, { createdAt: "desc" }],
      take,
      skip,
    });
  },

  count(params: { channelId: string; status?: string }) {
    return prisma.contentIdea.count({
      where: { channelId: params.channelId, ...(params.status ? { status: params.status } : {}) },
    });
  },

  update(id: string, data: Prisma.ContentIdeaUpdateInput) {
    return prisma.contentIdea.update({ where: { id }, data });
  },

  /** Recent idea titles for a channel, used to steer discovery away from repeats. */
  async recentTitles(channelId: string, limit = 40): Promise<string[]> {
    const rows = await prisma.contentIdea.findMany({
      where: { channelId },
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => r.title);
  },
};
