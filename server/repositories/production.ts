import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/** Repositories for production-stage entities tied to a script or video. */

export const assetPlanRepo = {
  upsertForScript(scriptPackageId: string, data: Omit<Prisma.AssetPlanCreateInput, "scriptPackage">) {
    return prisma.assetPlan.upsert({
      where: { scriptPackageId },
      create: { ...data, scriptPackage: { connect: { id: scriptPackageId } } },
      update: data,
    });
  },
  findByScript(scriptPackageId: string) {
    return prisma.assetPlan.findUnique({ where: { scriptPackageId } });
  },
};

export const voiceRepo = {
  create(data: Prisma.VoiceRenderCreateInput) {
    return prisma.voiceRender.create({ data });
  },
  update(id: string, data: Prisma.VoiceRenderUpdateInput) {
    return prisma.voiceRender.update({ where: { id }, data });
  },
  latestForScript(scriptPackageId: string) {
    return prisma.voiceRender.findFirst({
      where: { scriptPackageId, status: "COMPLETE" },
      orderBy: { createdAt: "desc" },
    });
  },
};

export const captionRepo = {
  upsertForScript(
    scriptPackageId: string,
    data: Omit<Prisma.CaptionTrackCreateInput, "scriptPackage">,
  ) {
    return prisma.captionTrack.upsert({
      where: { scriptPackageId },
      create: { ...data, scriptPackage: { connect: { id: scriptPackageId } } },
      update: data,
    });
  },
  findByScript(scriptPackageId: string) {
    return prisma.captionTrack.findUnique({ where: { scriptPackageId } });
  },
};

export const thumbnailRepo = {
  create(data: Prisma.ThumbnailVariantCreateInput) {
    return prisma.thumbnailVariant.create({ data });
  },
  deleteForVideo(videoProjectId: string) {
    return prisma.thumbnailVariant.deleteMany({ where: { videoProjectId } });
  },
  listForVideo(videoProjectId: string) {
    return prisma.thumbnailVariant.findMany({
      where: { videoProjectId },
      orderBy: { variantLabel: "asc" },
    });
  },
};

export const metadataRepo = {
  upsertForVideo(
    videoProjectId: string,
    data: Omit<Prisma.MetadataPackageCreateInput, "videoProject">,
  ) {
    return prisma.metadataPackage.upsert({
      where: { videoProjectId },
      create: { ...data, videoProject: { connect: { id: videoProjectId } } },
      update: data,
    });
  },
  findByVideo(videoProjectId: string) {
    return prisma.metadataPackage.findUnique({ where: { videoProjectId } });
  },
};

export const qaRepo = {
  create(data: Prisma.QARunCreateInput) {
    return prisma.qARun.create({ data });
  },
  latestForVideo(videoProjectId: string) {
    return prisma.qARun.findFirst({
      where: { videoProjectId },
      orderBy: { createdAt: "desc" },
    });
  },
};

export const publishRepo = {
  upsertForVideo(
    videoProjectId: string,
    data: Omit<Prisma.PublishPackageCreateInput, "videoProject">,
  ) {
    return prisma.publishPackage.upsert({
      where: { videoProjectId },
      create: { ...data, videoProject: { connect: { id: videoProjectId } } },
      update: data,
    });
  },
  findByVideo(videoProjectId: string) {
    return prisma.publishPackage.findUnique({ where: { videoProjectId } });
  },
};
