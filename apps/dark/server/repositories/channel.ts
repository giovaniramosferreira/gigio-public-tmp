import { prisma } from "@/lib/db";

/** Channel repository. The app operates one active channel at a time (V1). */
export const channelRepo = {
  findActive() {
    return prisma.channel.findFirst({
      where: { isActive: true },
      include: { pillars: { where: { active: true }, orderBy: { weight: "desc" } } },
    });
  },

  findById(id: string) {
    return prisma.channel.findUnique({
      where: { id },
      include: { pillars: true },
    });
  },

  list() {
    return prisma.channel.findMany({ orderBy: { createdAt: "desc" } });
  },

  findPillar(id: string) {
    return prisma.editorialPillar.findUnique({ where: { id } });
  },

  listPillars(channelId: string) {
    return prisma.editorialPillar.findMany({
      where: { channelId, active: true },
      orderBy: { weight: "desc" },
    });
  },
};
