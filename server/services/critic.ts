import { generateJson } from "@/lib/llm-json";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { scriptRepo } from "@/server/repositories/script";
import {
  criticResultSchema,
  scriptPackageSchema,
  type ScriptPackageOutput,
} from "./schemas";
import { checkOriginality } from "./originality";

const logger = log("critic");

const CHANNEL_THESIS =
  "A IA está mudando o mundo de maneiras que as pessoas não estão discutindo o suficiente — especialmente os efeitos colaterais.";

/** Run the critic pass (FR-06) over a script and persist the structured critique. */
export async function critiqueScript(scriptId: string): Promise<{
  verdict: "APPROVE" | "REWRITE" | "BLOCK";
}> {
  const script = await scriptRepo.findById(scriptId);
  if (!script) throw new Error(`Script ${scriptId} not found`);

  const { data, model } = await generateJson(
    "critic/critique-script",
    {
      full_script: script.fullScript ?? "",
      selected_hook: script.selectedHook ?? "",
      thesis: script.thesis ?? "",
      title: script.title,
    },
    criticResultSchema,
    { maxTokens: 2048, temperature: 0.4 },
  );

  // Merge the critique into existing critic notes (preserve originality report).
  const existingNotes = script.criticNotesJson ? JSON.parse(script.criticNotesJson) : {};
  await scriptRepo.update(scriptId, {
    criticNotesJson: JSON.stringify({ ...existingNotes, critique: data, criticModel: model }),
    status: data.verdict === "BLOCK" ? "BLOCKED" : data.verdict === "REWRITE" ? "REWRITE" : "CRITIC_REVIEW",
  });

  logger.info({ scriptId, verdict: data.verdict }, "critic pass complete");
  return { verdict: data.verdict };
}

/**
 * Rewrite a script incorporating critic guidance (FR-06), re-checking
 * originality. Respects the max-auto-rewrites cap; beyond it, requires a human.
 */
export async function rewriteScript(
  scriptId: string,
  instructions?: string,
): Promise<{ scriptId: string; rewriteCount: number; capReached: boolean }> {
  const script = await scriptRepo.findById(scriptId);
  if (!script) throw new Error(`Script ${scriptId} not found`);

  if (script.rewriteCount >= env.MAX_AUTO_REWRITES) {
    logger.warn({ scriptId, rewriteCount: script.rewriteCount }, "rewrite cap reached");
    return { scriptId, rewriteCount: script.rewriteCount, capReached: true };
  }

  const notes = script.criticNotesJson ? JSON.parse(script.criticNotesJson) : {};
  const criticGuidance: string = notes.critique?.rewrite_guidance ?? "";

  const original: Partial<ScriptPackageOutput> = {
    thesis: script.thesis ?? "",
    selected_hook: script.selectedHook ?? "",
    full_script: script.fullScript ?? "",
    hook_variants: script.hookVariantsJson ? JSON.parse(script.hookVariantsJson) : [],
    beat_plan: script.beatPlanJson ? JSON.parse(script.beatPlanJson) : [],
    title_variants: notes.titleVariants ?? [script.title],
  };

  const { data, model, promptVersion } = await generateJson(
    "critic/rewrite-script",
    {
      original_script_json: JSON.stringify(original),
      critic_guidance: criticGuidance,
      rewrite_instructions: instructions ?? "",
    },
    scriptPackageSchema,
    { maxTokens: 4096, temperature: 0.85 },
  );

  const originality = await checkOriginality(
    script.contentIdea.channelId,
    {
      title: data.title_variants[0] ?? script.title,
      selected_hook: data.selected_hook,
      thesis: data.thesis,
      full_script: data.full_script,
    },
    scriptId,
  );

  await scriptRepo.update(scriptId, {
    title: data.title_variants[0] ?? script.title,
    thesis: data.thesis,
    audienceFrame: data.audience_frame,
    hookVariantsJson: JSON.stringify(data.hook_variants),
    selectedHook: data.selected_hook,
    beatPlanJson: JSON.stringify(data.beat_plan),
    fullScript: data.full_script,
    wordCount: data.word_count,
    estimatedDurationSeconds: data.estimated_duration_seconds,
    rewriteCount: script.rewriteCount + 1,
    rewriteInstructions: instructions ?? criticGuidance,
    originalityScore: Math.round(originality.aggregateOriginality * 100),
    generationModel: model,
    generationPromptVersion: promptVersion,
    status: originality.decision === "BLOCK" ? "BLOCKED" : "CRITIC_REVIEW",
    criticNotesJson: JSON.stringify({
      ...notes,
      titleVariants: data.title_variants,
      safetyNotes: data.safety_notes,
      originality,
    }),
  });

  logger.info({ scriptId, rewriteCount: script.rewriteCount + 1 }, "script rewritten");
  return { scriptId, rewriteCount: script.rewriteCount + 1, capReached: false };
}
