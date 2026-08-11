import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** ScriptPackage repository. */
export const scriptRepo = {
  create(data: Prisma.ScriptPackageCreateInput) {
    return prisma.scriptPackage.create({ data });
  },

  findById(id: string) {
    return prisma.scriptPackage.findUnique({
      where: { id },
      include: { contentIdea: { include: { pillar: true } } },
    });
  },

  findByIdeaId(contentIdeaId: string) {
    return prisma.scriptPackage.findUnique({ where: { contentIdeaId } });
  },

  list(params: { status?: string; take?: number; skip?: number }) {
    const { status, take = 50, skip = 0 } = params;
    return prisma.scriptPackage.findMany({
      where: status ? { status } : {},
      include: { contentIdea: { include: { pillar: true } } },
      orderBy: { updatedAt: "desc" },
      take,
      skip,
    });
  },

  update(id: string, data: Prisma.ScriptPackageUpdateInput) {
    return prisma.scriptPackage.update({ where: { id }, data });
  },

  /**
   * Recent opening lines (selected hooks) across the channel's scripts, used by
   * generation/originality to avoid repeating opening patterns.
   */
  async recentOpenings(channelId: string, limit = 25): Promise<string[]> {
    const rows = await prisma.scriptPackage.findMany({
      where: { contentIdea: { channelId }, selectedHook: { not: null } },
      select: { selectedHook: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => r.selectedHook ?? "").filter(Boolean);
  },
};
