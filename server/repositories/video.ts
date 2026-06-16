import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** VideoProject repository plus access to its production children. */
export const videoRepo = {
  create(data: Prisma.VideoProjectCreateInput) {
    return prisma.videoProject.create({ data });
  },

  findById(id: string) {
    return prisma.videoProject.findUnique({
      where: { id },
      include: {
        scriptPackage: { include: { contentIdea: { include: { pillar: true } } } },
        thumbnails: { orderBy: { variantLabel: "asc" } },
        metadata: true,
        qaRuns: { orderBy: { createdAt: "desc" } },
        publishPackage: true,
      },
    });
  },

  findByScriptId(scriptPackageId: string) {
    return prisma.videoProject.findUnique({ where: { scriptPackageId } });
  },

  list(params: { channelId?: string; status?: string; take?: number } = {}) {
    const { channelId, status, take = 50 } = params;
    return prisma.videoProject.findMany({
      where: { ...(channelId ? { channelId } : {}), ...(status ? { status } : {}) },
      include: { scriptPackage: true, qaRuns: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take,
    });
  },

  update(id: string, data: Prisma.VideoProjectUpdateInput) {
    return prisma.videoProject.update({ where: { id }, data });
  },
};
