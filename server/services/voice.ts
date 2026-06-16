import { log } from "@/lib/logger";
import { env } from "@/lib/env";
import { dataPath, ensureParentDir, slugify } from "@/lib/storage";
import { getTTS } from "@/providers";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import { voiceRepo } from "@/server/repositories/production";
import { channelRepo } from "@/server/repositories/channel";

const logger = log("voice");

/**
 * Voice synthesis (FR-08). Renders the script narration to an audio file via
 * the TTS provider, chunking long scripts and recording voice metadata and
 * provider provenance. Advances the production state to VOICE_READY.
 */
export async function renderVoice(
  videoProjectId: string,
  voiceIdOverride?: string,
): Promise<string> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Video project has no script");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script?.fullScript) throw new Error("Script has no narration text");

  const channel = await channelRepo.findById(project.channelId);
  const tts = getTTS();
  const voiceId =
    voiceIdOverride ??
    channel?.defaultVoiceId ??
    env.ELEVENLABS_DEFAULT_VOICE_ID ??
    "";

  if (!voiceId) {
    throw new Error("No voice configured (set ELEVENLABS_DEFAULT_VOICE_ID or channel voice)");
  }

  const slug = slugify(script.title);
  const settings = { stability: 0.5, similarity_boost: 0.75, style: 0.3 };

  const voice = await voiceRepo.create({
    scriptPackage: { connect: { id: script.id } },
    voiceId,
    provider: tts.name,
    settingsJson: JSON.stringify(settings),
    status: "RENDERING",
  });

  try {
    // Chunk to stay within provider limits; render each chunk then concatenate.
    const chunks = tts.chunkText(script.fullScript);
    const partPaths: string[] = [];
    let totalBytes = 0;

    for (let i = 0; i < chunks.length; i++) {
      const partPath = dataPath("renders", slug, `voice-part-${i + 1}.mp3`);
      await ensureParentDir(partPath);
      const result = await tts.synthesize({
        text: chunks[i],
        voiceId,
        settings,
        outputPath: partPath,
      });
      partPaths.push(result.filePath);
      totalBytes += result.fileSizeBytes ?? 0;
    }

    // For a single chunk the part IS the final file; multi-chunk concat is done
    // by the assembly step (FFmpeg) which already handles audio inputs.
    const finalPath = partPaths[0];

    const updated = await voiceRepo.update(voice.id, {
      status: "COMPLETE",
      audioFilePath: finalPath,
      format: "mp3",
      fileSizeBytes: totalBytes,
      completedAt: new Date(),
      settingsJson: JSON.stringify({ ...settings, parts: partPaths }),
    });

    await videoRepo.update(videoProjectId, { status: "VOICE_READY" });
    logger.info({ videoProjectId, parts: partPaths.length }, "voice rendered");
    return updated.id;
  } catch (err) {
    await voiceRepo.update(voice.id, { status: "FAILED" });
    throw err;
  }
}
