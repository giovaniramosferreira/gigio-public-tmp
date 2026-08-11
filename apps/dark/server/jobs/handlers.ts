import { JOB_TYPES, registerHandler } from "@/lib/jobs";
import { discoverIdeas, type DiscoverInput } from "@/server/services/discovery";
import { generateScript } from "@/server/services/script";
import { critiqueScript, rewriteScript } from "@/server/services/critic";
import { startProduction } from "@/server/services/production";
import { generateAssetPlan } from "@/server/services/assets";
import { renderVoice } from "@/server/services/voice";
import { generateCaptions } from "@/server/services/captions";
import { assembleVideo } from "@/server/services/assembly";
import { generateThumbnails } from "@/server/services/thumbnails";
import { generateMetadata } from "@/server/services/metadata";
import { runQA } from "@/server/services/qa";
import { exportPackage } from "@/server/services/export";

let registered = false;

/**
 * Register all job handlers exactly once. Called from the app bootstrap
 * (lib/init). Each handler adapts a service to the JobHandler contract,
 * surfacing a resultId for the polling client.
 */
export function registerJobHandlers(): void {
  if (registered) return;
  registered = true;

  registerHandler<DiscoverInput>(JOB_TYPES.IDEAS_DISCOVER, async (input, ctx) => {
    await ctx.log(`Discovering ideas for channel ${input.channelId}`);
    const result = await discoverIdeas(input);
    await ctx.log(`Created ${result.created} scored ideas`);
    return { resultId: input.channelId, result };
  });

  registerHandler<{ ideaId: string }>(JOB_TYPES.SCRIPT_GENERATE, async (input, ctx) => {
    await ctx.log(`Generating script for idea ${input.ideaId}`);
    const scriptId = await generateScript(input.ideaId);
    await ctx.log(`Script ${scriptId} generated`);
    return { resultId: scriptId, result: { scriptId } };
  });

  registerHandler<{ scriptId: string }>(JOB_TYPES.SCRIPT_CRITIC, async (input, ctx) => {
    await ctx.log(`Running critic pass on script ${input.scriptId}`);
    const { verdict } = await critiqueScript(input.scriptId);
    await ctx.log(`Critic verdict: ${verdict}`);
    return { resultId: input.scriptId, result: { verdict } };
  });

  registerHandler<{ scriptId: string; instructions?: string }>(
    JOB_TYPES.SCRIPT_REWRITE,
    async (input, ctx) => {
      await ctx.log(`Rewriting script ${input.scriptId}`);
      const result = await rewriteScript(input.scriptId, input.instructions);
      await ctx.log(
        result.capReached
          ? "Rewrite cap reached; human review required"
          : `Rewrite ${result.rewriteCount} complete`,
      );
      return { resultId: input.scriptId, result };
    },
  );

  // ---- Production / media pipeline ----

  registerHandler<{ scriptId: string }>(JOB_TYPES.PRODUCTION_START, async (input, ctx) => {
    await ctx.log(`Starting production for script ${input.scriptId}`);
    const videoProjectId = await startProduction(input.scriptId);
    await ctx.log(`Video project ${videoProjectId} created`);
    return { resultId: videoProjectId, result: { videoProjectId } };
  });

  registerHandler<{ videoProjectId: string }>(JOB_TYPES.ASSETS_GENERATE, async (input, ctx) => {
    await ctx.log("Generating asset plan and scene images");
    await generateAssetPlan(input.videoProjectId);
    await ctx.log("Asset plan ready");
    return { resultId: input.videoProjectId };
  });

  registerHandler<{ videoProjectId: string; voiceId?: string }>(
    JOB_TYPES.VOICE_RENDER,
    async (input, ctx) => {
      await ctx.log("Rendering voiceover");
      const voiceId = await renderVoice(input.videoProjectId, input.voiceId);
      await ctx.log("Voice render complete");
      return { resultId: input.videoProjectId, result: { voiceId } };
    },
  );

  registerHandler<{ videoProjectId: string }>(JOB_TYPES.CAPTIONS_GENERATE, async (input, ctx) => {
    await ctx.log("Generating captions");
    await generateCaptions(input.videoProjectId);
    await ctx.log("Captions ready");
    return { resultId: input.videoProjectId };
  });

  registerHandler<{ videoProjectId: string }>(JOB_TYPES.VIDEO_ASSEMBLE, async (input, ctx) => {
    await ctx.log("Assembling preview video (FFmpeg)");
    await assembleVideo(input.videoProjectId);
    await ctx.log("Preview rendered");
    return { resultId: input.videoProjectId };
  });

  registerHandler<{ videoProjectId: string }>(JOB_TYPES.THUMBNAILS_GENERATE, async (input, ctx) => {
    await ctx.log("Generating thumbnail variants");
    await generateThumbnails(input.videoProjectId);
    await ctx.log("Thumbnails ready");
    return { resultId: input.videoProjectId };
  });

  registerHandler<{ videoProjectId: string }>(JOB_TYPES.METADATA_GENERATE, async (input, ctx) => {
    await ctx.log("Generating metadata package");
    await generateMetadata(input.videoProjectId);
    await ctx.log("Metadata ready");
    return { resultId: input.videoProjectId };
  });

  registerHandler<{ videoProjectId: string }>(JOB_TYPES.QA_RUN, async (input, ctx) => {
    await ctx.log("Running QA engine");
    const { decision } = await runQA(input.videoProjectId);
    await ctx.log(`QA decision: ${decision}`);
    return { resultId: input.videoProjectId, result: { decision } };
  });

  registerHandler<{ videoProjectId: string }>(JOB_TYPES.PACKAGE_EXPORT, async (input, ctx) => {
    await ctx.log("Exporting publish package");
    const folder = await exportPackage(input.videoProjectId);
    await ctx.log(`Exported to ${folder}`);
    return { resultId: input.videoProjectId, result: { folder } };
  });
}
