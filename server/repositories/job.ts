import { prisma } from "@/lib/db";

/** JobRun repository (read side; writes are owned by the queue). */
export const jobRepo = {
  findById(id: string) {
    return prisma.jobRun.findUnique({ where: { id } });
  },

  list(params: { status?: string; jobType?: string; take?: number }) {
    const { status, jobType, take = 50 } = params;
    return prisma.jobRun.findMany({
      where: { ...(status ? { status } : {}), ...(jobType ? { jobType } : {}) },
      orderBy: { queuedAt: "desc" },
      take,
    });
  },

  countActive() {
    return prisma.jobRun.count({ where: { status: { in: ["QUEUED", "RUNNING"] } } });
  },
};
