import { log } from "@/lib/logger";
import { dataPath, ensureParentDir, slugify, writeFileEnsured } from "@/lib/storage";
import {
  cuesToSrt,
  cuesToVtt,
  estimateWordTimings,
  groupWordsIntoCues,
  type TimedWord,
} from "@/lib/captions";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import { captionRepo, voiceRepo } from "@/server/repositories/production";

const logger = log("captions");

/**
 * Caption generation (FR-09). Builds SRT + VTT subtitle tracks aligned to the
 * rendered audio. Uses provider word timings when available; otherwise
 * estimates timings from the script and known audio duration. Advances
 * production state to CAPTIONS_READY.
 */
export async function generateCaptions(videoProjectId: string): Promise<string> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Video project has no script");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script?.fullScript) throw new Error("Script has no narration text");

  const voice = await voiceRepo.latestForScript(script.id);

  // Prefer real word timings stored on the voice render; fall back to estimate.
  let words: TimedWord[] = [];
  if (voice?.settingsJson) {
    const parsed = JSON.parse(voice.settingsJson);
    if (Array.isArray(parsed.wordTimings)) words = parsed.wordTimings as TimedWord[];
  }
  if (words.length === 0) {
    const duration =
      voice?.durationSeconds ?? script.estimatedDurationSeconds ?? 45;
    words = estimateWordTimings(script.fullScript, duration);
  }

  const cues = groupWordsIntoCues(words);
  const srt = cuesToSrt(cues);
  const vtt = cuesToVtt(cues);

  const slug = slugify(script.title);
  const srtPath = dataPath("renders", slug, "captions.srt");
  const vttPath = dataPath("renders", slug, "captions.vtt");
  await ensureParentDir(srtPath);
  await writeFileEnsured(srtPath, srt);
  await writeFileEnsured(vttPath, vtt);

  await captionRepo.upsertForScript(script.id, {
    voiceRender: voice ? { connect: { id: voice.id } } : undefined,
    sourceType: words.length && voice ? "provider-timings" : "estimated",
    srtPath,
    vttPath,
    timingJson: JSON.stringify(cues),
    wordCount: words.length,
    status: "COMPLETE",
    completedAt: new Date(),
  });

  await videoRepo.update(videoProjectId, { status: "CAPTIONS_READY" });
  logger.info({ videoProjectId, cues: cues.length }, "captions generated");
  return videoProjectId;
}
