import { log } from "@/lib/logger";
import { slugify } from "@/lib/storage";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";

const logger = log("production");

/**
 * Approve a script for production (script state machine -> APPROVED_FOR_PRODUCTION)
 * and create the VideoProject that drives the media pipeline. Idempotent: if a
 * project already exists for the script it is returned.
 */
export async function startProduction(scriptId: string): Promise<string> {
  const script = await scriptRepo.findById(scriptId);
  if (!script) throw new Error(`Script ${scriptId} not found`);
  if (script.status === "BLOCKED") {
    throw new Error("Script is BLOCKED by originality/critic and cannot enter production");
  }

  const existing = await videoRepo.findByScriptId(scriptId);
  if (existing) return existing.id;

  await scriptRepo.update(scriptId, {
    status: "APPROVED_FOR_PRODUCTION",
    approvedAt: new Date(),
    approvedBy: "operator",
  });

  const renderSpec = {
    aspectRatio: "9:16",
    resolution: "1080x1920",
    frameRate: 30,
    captions: { mode: "burn-in" },
  };

  const project = await videoRepo.create({
    channel: { connect: { id: script.contentIdea.channelId } },
    scriptPackage: { connect: { id: scriptId } },
    title: script.title,
    status: "PENDING_ASSETS",
    aspectRatio: "9:16",
    resolution: "1080x1920",
    frameRate: 30,
    renderSpecJson: JSON.stringify(renderSpec),
  });

  logger.info({ projectId: project.id, slug: slugify(script.title) }, "production started");
  return project.id;
}
