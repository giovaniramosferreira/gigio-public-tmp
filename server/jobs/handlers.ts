import { JOB_TYPES, registerHandler } from "@/lib/jobs";
import { discoverIdeas, type DiscoverInput } from "@/server/services/discovery";
import { generateScript } from "@/server/services/script";
import { critiqueScript, rewriteScript } from "@/server/services/critic";

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
}
