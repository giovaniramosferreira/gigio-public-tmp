import { promises as fs } from "fs";
import { log } from "@/lib/logger";
import { assertFfmpeg, runFfmpeg, probeDuration } from "@/lib/ffmpeg";
import { dataPath, ensureParentDir, fileExists, slugify } from "@/lib/storage";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import {
  assetPlanRepo,
  captionRepo,
  voiceRepo,
} from "@/server/repositories/production";

const logger = log("assembly");

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

interface SceneImage {
  filePath: string;
  start: number;
  end: number;
}

/**
 * Video assembly (FR-10). Composes the rendered audio, scene images, and
 * burned-in captions into a 9:16 preview MP4 via FFmpeg. Falls back to a solid
 * editorial background when scene images are unavailable, so a preview always
 * renders. Verifies the output (non-zero duration) before marking it ready.
 */
export async function assembleVideo(videoProjectId: string): Promise<string> {
  await assertFfmpeg();

  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Projeto de vídeo não tem roteiro");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script) throw new Error("Roteiro não encontrado para o projeto");

  const voice = await voiceRepo.latestForScript(script.id);
  if (!voice?.audioFilePath || !(await fileExists(voice.audioFilePath))) {
    throw new Error("Áudio de voz ausente; renderize a voz antes de montar");
  }

  const captions = await captionRepo.findByScript(script.id);
  const assetPlan = await assetPlanRepo.findByScript(script.id);

  const slug = slugify(script.title);
  const audioDuration = await probeDuration(voice.audioFilePath);
  const totalDuration = audioDuration > 0 ? audioDuration : script.estimatedDurationSeconds ?? 45;

  await videoRepo.update(videoProjectId, { status: "QA_RUNNING" });

  // Resolve scene images (only those that actually exist on disk).
  const scenes: SceneImage[] = [];
  if (assetPlan?.scenePromptsJson && assetPlan.provenanceJson) {
    const scenePrompts = JSON.parse(assetPlan.scenePromptsJson) as Array<{
      t_start: number;
      t_end: number;
    }>;
    const provenance = JSON.parse(assetPlan.provenanceJson) as {
      assets: Array<{ scene: number; status: string; filePath?: string }>;
    };
    for (let i = 0; i < scenePrompts.length; i++) {
      const asset = provenance.assets.find((a) => a.scene === i + 1);
      if (asset?.status === "generated" && asset.filePath && (await fileExists(asset.filePath))) {
        scenes.push({
          filePath: asset.filePath,
          start: scenePrompts[i].t_start,
          end: scenePrompts[i].t_end || totalDuration,
        });
      }
    }
  }

  const previewPath = dataPath("renders", slug, "preview.mp4");
  await ensureParentDir(previewPath);

  const args: string[] = ["-y"];
  const filters: string[] = [];
  let videoLabel: string;

  if (scenes.length > 0) {
    // Each scene image becomes a looped input clipped to its beat duration.
    scenes.forEach((scene) => {
      const dur = Math.max(0.5, scene.end - scene.start);
      args.push("-loop", "1", "-t", dur.toFixed(2), "-i", scene.filePath);
    });
    const scaled = scenes
      .map((_, i) => {
        const label = `v${i}`;
        filters.push(
          `[${i}:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,` +
            `crop=${WIDTH}:${HEIGHT},setsar=1,fps=${FPS}[${label}]`,
        );
        return `[${label}]`;
      })
      .join("");
    filters.push(`${scaled}concat=n=${scenes.length}:v=1:a=0[vbase]`);
    videoLabel = "vbase";
  } else {
    // Fallback: solid editorial background for the full duration.
    args.push(
      "-f", "lavfi",
      "-t", totalDuration.toFixed(2),
      "-i", `color=c=0x0B1120:s=${WIDTH}x${HEIGHT}:r=${FPS}`,
    );
    videoLabel = "0:v";
  }

  // Audio input.
  const audioIndex = scenes.length > 0 ? scenes.length : 1;
  args.push("-i", voice.audioFilePath);

  // Burn in captions when an SRT track exists.
  if (captions?.srtPath && (await fileExists(captions.srtPath))) {
    const escaped = captions.srtPath.replace(/\\/g, "/").replace(/:/g, "\\:");
    filters.push(
      `[${videoLabel}]subtitles='${escaped}':force_style='Fontsize=18,` +
        `PrimaryColour=&Hffffff&,Outline=2,Shadow=0,Alignment=2,MarginV=120'[vout]`,
    );
    videoLabel = "vout";
  }

  if (filters.length > 0) {
    args.push("-filter_complex", filters.join(";"));
    args.push("-map", `[${videoLabel}]`);
  } else {
    args.push("-map", `${videoLabel}`);
  }
  args.push("-map", `${audioIndex}:a`);

  args.push(
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    "-shortest",
    "-r", String(FPS),
    previewPath,
  );

  logger.info({ videoProjectId, scenes: scenes.length }, "starting ffmpeg assembly");
  await runFfmpeg(args);

  // Verify the render is not a black/silent failure: it must exist with duration.
  if (!(await fileExists(previewPath))) {
    throw new Error("A montagem não produziu arquivo de saída");
  }
  const previewDuration = await probeDuration(previewPath);
  if (previewDuration <= 0) {
    throw new Error("Saída da montagem tem duração zero (renderização corrompida)");
  }
  const stat = await fs.stat(previewPath);

  await videoRepo.update(videoProjectId, {
    status: "PREVIEW_RENDERED",
    previewFilePath: previewPath,
    durationSeconds: previewDuration,
    fileSizeBytes: stat.size,
  });

  logger.info({ videoProjectId, previewDuration, bytes: stat.size }, "preview rendered");
  return videoProjectId;
}
