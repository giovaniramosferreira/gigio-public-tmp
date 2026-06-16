import { generateJson } from "@/lib/llm-json";
import { log } from "@/lib/logger";
import { dataPath, ensureParentDir, slugify } from "@/lib/storage";
import { getImage } from "@/providers";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import { assetPlanRepo } from "@/server/repositories/production";
import { assetPlanSchema } from "./schemas";

const logger = log("assets");

const VISUAL_IDENTITY =
  "Restrained, editorial, slightly unsettling. Muted palette, real-world texture, negative space. No glowing-brain/robot/blue-circuit cliches. Visuals carry meaning, not decoration.";

/**
 * Asset direction package (FR-07): generate per-beat visual directions via the
 * LLM, then render scene images with the image provider. Image generation is
 * best-effort per scene; failures are recorded in provenance without aborting
 * the whole plan. Records provider provenance for every generated asset.
 */
export async function generateAssetPlan(videoProjectId: string): Promise<string> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Video project has no script");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script) throw new Error("Script not found for project");

  const beatPlan = script.beatPlanJson ? JSON.parse(script.beatPlanJson) : [];

  const { data, model, promptVersion } = await generateJson(
    "visual/scene-directions",
    {
      beat_plan_json: JSON.stringify(beatPlan),
      channel_visual_identity: VISUAL_IDENTITY,
      recent_visual_styles: "",
    },
    assetPlanSchema,
    { maxTokens: 3072, temperature: 0.8 },
  );

  const image = getImage();
  const slug = slugify(script.title);
  const provenance: Array<Record<string, unknown>> = [];

  for (let i = 0; i < data.scenes.length; i++) {
    const scene = data.scenes[i];
    const outPath = dataPath("assets", slug, `scene-${String(i + 1).padStart(2, "0")}.png`);
    if (!image.isConfigured()) {
      provenance.push({ scene: i + 1, status: "skipped", reason: "image provider not configured" });
      continue;
    }
    try {
      await ensureParentDir(outPath);
      const result = await image.generate({
        prompt: scene.image_prompt,
        width: 1080,
        height: 1920,
        outputPath: outPath,
      });
      provenance.push({
        scene: i + 1,
        status: "generated",
        provider: image.name,
        filePath: result.filePath,
        prompt: scene.image_prompt,
        requestId: result.providerRequestId,
      });
    } catch (err) {
      logger.warn({ scene: i + 1, err: (err as Error).message }, "scene image failed");
      provenance.push({ scene: i + 1, status: "failed", error: (err as Error).message });
    }
  }

  const allGenerated = provenance.every((p) => p.status === "generated");
  await assetPlanRepo.upsertForScript(script.id, {
    visualStyleNotes: data.visual_style_notes,
    scenePromptsJson: JSON.stringify(data.scenes),
    textOverlayOptionsJson: JSON.stringify(data.text_overlay_options),
    provenanceJson: JSON.stringify({ model, promptVersion, assets: provenance }),
    totalScenes: data.scenes.length,
    provider: image.name,
    status: allGenerated ? "COMPLETE" : "PARTIAL",
    completedAt: new Date(),
  });

  await videoRepo.update(videoProjectId, { status: "PENDING_ASSETS" });
  logger.info({ videoProjectId, scenes: data.scenes.length, allGenerated }, "asset plan ready");
  return videoProjectId;
}
